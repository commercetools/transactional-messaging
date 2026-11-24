import { Client } from '@sendgrid/client';
import CustomError from '../errors/custom.error';

export type Channel = 'email' | 'sms';

export const SMS_PREFIX = '[SMS] ';
export const MAX_NAME_LENGTH = 100;
export const TEMPLATE_ID_PATTERN = /^d-[0-9a-f]{32}$/;

export type TemplateSummary = {
  id: string;
  name: string;
  channel: Channel;
  updatedAt: string;
};

export type TemplateDetail = TemplateSummary & {
  subject: string;
  html: string;
  text: string;
};

export type TemplateInput = {
  name: string;
  subject: string;
  html: string;
  text: string;
};

type SendGridVersion = {
  id: string;
  active: number;
  name: string;
  subject?: string;
  html_content?: string;
  plain_content?: string;
  updated_at: string;
};

type SendGridTemplate = {
  id: string;
  name: string;
  generation: string;
  updated_at: string;
  versions?: SendGridVersion[];
};

type TemplatesPage = {
  result: SendGridTemplate[];
  _metadata?: { next?: string };
};

export const channelOf = (sendGridName: string): Channel =>
  sendGridName.startsWith(SMS_PREFIX) ? 'sms' : 'email';

export const displayName = (sendGridName: string): string =>
  sendGridName.startsWith(SMS_PREFIX)
    ? sendGridName.slice(SMS_PREFIX.length)
    : sendGridName;

export const storedName = (name: string, channel: Channel): string =>
  channel === 'sms' ? `${SMS_PREFIX}${name}` : name;

const summaryOf = (template: SendGridTemplate): TemplateSummary => ({
  id: template.id,
  name: displayName(template.name),
  channel: channelOf(template.name),
  updatedAt: template.updated_at,
});

const activeVersion = (
  template: SendGridTemplate
): SendGridVersion | undefined =>
  template.versions?.find((version) => version.active === 1) ??
  template.versions?.[0];

export type TemplateGateway = {
  list(): Promise<TemplateSummary[]>;
  get(id: string): Promise<TemplateDetail>;
  create(channel: Channel, input: TemplateInput): Promise<TemplateDetail>;
  update(
    id: string,
    channel: Channel,
    input: TemplateInput
  ): Promise<TemplateDetail>;
  remove(id: string): Promise<void>;
};

type Options = { apiKey: string; dataResidency: 'global' | 'eu' };

export const createTemplateGateway = ({
  apiKey,
  dataResidency,
}: Options): TemplateGateway => {
  // A dedicated client keeps the key and the data residency out of the SDK's shared singleton.
  const client = new Client();
  client.setApiKey(apiKey);
  if (dataResidency === 'eu') client.setDataResidency('eu');

  const request = async <T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    options: { body?: object; qs?: object } = {}
  ): Promise<T> => {
    const [, body] = await client.request({
      method,
      url,
      ...(options.body ? { body: options.body } : {}),
      ...(options.qs ? { qs: options.qs as Record<string, unknown> } : {}),
    });
    return body as T;
  };

  const detailOf = (template: SendGridTemplate): TemplateDetail => {
    const version = activeVersion(template);
    return {
      ...summaryOf(template),
      subject: version?.subject ?? '',
      html: version?.html_content ?? '',
      text: version?.plain_content ?? '',
    };
  };

  const versionBody = (channel: Channel, input: TemplateInput) => ({
    name: input.name,
    subject: channel === 'sms' ? input.name : input.subject,
    // SMS keeps the body in plain_content; html_content mirrors it because SendGrid wants some content.
    html_content: channel === 'sms' ? input.text : input.html,
    plain_content: input.text,
    generate_plain_content: false,
    active: 1,
  });

  return {
    async list() {
      const templates: SendGridTemplate[] = [];
      let pageToken: string | undefined;
      do {
        const page = await request<TemplatesPage>('GET', 'v3/templates', {
          qs: {
            generations: 'dynamic',
            page_size: 200,
            ...(pageToken ? { page_token: pageToken } : {}),
          },
        });
        templates.push(...page.result);
        const next = page._metadata?.next;
        pageToken = next
          ? (new URL(next, 'https://api.sendgrid.com').searchParams.get(
              'page_token'
            ) ?? undefined)
          : undefined;
      } while (pageToken);
      return templates.map(summaryOf);
    },

    async get(id) {
      return detailOf(
        await request<SendGridTemplate>('GET', `v3/templates/${id}`)
      );
    },

    async create(channel, input) {
      const created = await request<SendGridTemplate>('POST', 'v3/templates', {
        body: { name: storedName(input.name, channel), generation: 'dynamic' },
      });
      try {
        await request('POST', `v3/templates/${created.id}/versions`, {
          body: { ...versionBody(channel, input), editor: 'code' },
        });
      } catch (error) {
        // Do not leave an empty template behind when its first version is rejected.
        await request('DELETE', `v3/templates/${created.id}`).catch(
          () => undefined
        );
        throw error;
      }
      return detailOf(
        await request<SendGridTemplate>('GET', `v3/templates/${created.id}`)
      );
    },

    async update(id, channel, input) {
      const existing = await request<SendGridTemplate>(
        'GET',
        `v3/templates/${id}`
      );
      if (channelOf(existing.name) !== channel) {
        throw new CustomError(400, 'The type of a template cannot be changed.');
      }
      const version = activeVersion(existing);
      const name = storedName(input.name, channel);
      if (name !== existing.name) {
        await request('PATCH', `v3/templates/${id}`, { body: { name } });
      }
      if (version) {
        // PATCH rejects the read-only editor and updated_at fields, so they are not part of the body.
        await request('PATCH', `v3/templates/${id}/versions/${version.id}`, {
          body: versionBody(channel, input),
        });
      } else {
        await request('POST', `v3/templates/${id}/versions`, {
          body: { ...versionBody(channel, input), editor: 'code' },
        });
      }
      return detailOf(
        await request<SendGridTemplate>('GET', `v3/templates/${id}`)
      );
    },

    async remove(id) {
      await request('DELETE', `v3/templates/${id}`);
    },
  };
};
