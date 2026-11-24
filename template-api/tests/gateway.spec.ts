import { createTemplateGateway } from '../src/sendgrid/templates';

const mockRequest = jest.fn();
const mockSetApiKey = jest.fn();
const mockSetDataResidency = jest.fn();

jest.mock('@sendgrid/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    request: (...args: unknown[]) => mockRequest(...args),
    setApiKey: (...args: unknown[]) => mockSetApiKey(...args),
    setDataResidency: (...args: unknown[]) => mockSetDataResidency(...args),
  })),
}));

const reply = (body: unknown) => Promise.resolve([{ statusCode: 200 }, body]);
const ID = 'd-0123456789abcdef0123456789abcdef';
const version = (overrides = {}) => ({
  id: 'v1',
  active: 1,
  name: 'v',
  subject: 'Subject',
  html_content: '<p>x</p>',
  plain_content: 'x',
  updated_at: 'u',
  ...overrides,
});
const template = (name: string, versions = [version()]) => ({
  id: ID,
  name,
  generation: 'dynamic',
  updated_at: 'u',
  versions,
});

const gateway = () =>
  createTemplateGateway({ apiKey: 'SG.k', dataResidency: 'global' });

beforeEach(() => {
  mockRequest.mockReset();
  mockSetApiKey.mockReset();
  mockSetDataResidency.mockReset();
});

describe('client setup', () => {
  it('uses the key and the EU residency when configured', () => {
    createTemplateGateway({ apiKey: 'SG.k', dataResidency: 'eu' });
    expect(mockSetApiKey).toHaveBeenCalledWith('SG.k');
    expect(mockSetDataResidency).toHaveBeenCalledWith('eu');
  });

  it('keeps the global host by default', () => {
    gateway();
    expect(mockSetDataResidency).not.toHaveBeenCalled();
  });
});

describe('list', () => {
  it('follows every page and tells SMS apart by the name prefix', async () => {
    mockRequest
      .mockReturnValueOnce(
        reply({
          result: [template('Welcome')],
          _metadata: {
            next: 'https://api.sendgrid.com/v3/templates?page_token=abc',
          },
        })
      )
      .mockReturnValueOnce(reply({ result: [template('[SMS] Order')] }));
    const items = await gateway().list();
    expect(items.map((i) => [i.name, i.channel])).toEqual([
      ['Welcome', 'email'],
      ['Order', 'sms'],
    ]);
    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(mockRequest.mock.calls[1][0].qs).toMatchObject({
      page_token: 'abc',
    });
    expect(mockRequest.mock.calls[0][0].qs).toMatchObject({
      generations: 'dynamic',
      page_size: 200,
    });
  });
});

describe('get', () => {
  it('returns the active version', async () => {
    mockRequest.mockReturnValueOnce(
      reply(
        template('Welcome', [
          version({ id: 'old', active: 0, subject: 'Old' }),
          version({ id: 'cur', active: 1, subject: 'Current' }),
        ])
      )
    );
    const detail = await gateway().get(ID);
    expect(detail).toMatchObject({
      subject: 'Current',
      html: '<p>x</p>',
      text: 'x',
    });
  });
});

describe('create', () => {
  it('creates an email template with a code-editor version', async () => {
    mockRequest
      .mockReturnValueOnce(reply({ id: ID, name: 'Welcome' }))
      .mockReturnValueOnce(reply({ id: 'v1' }))
      .mockReturnValueOnce(reply(template('Welcome')));
    await gateway().create('email', {
      name: 'Welcome',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: '',
    });
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      url: 'v3/templates',
      body: { name: 'Welcome', generation: 'dynamic' },
    });
    expect(mockRequest.mock.calls[1][0].body).toMatchObject({
      subject: 'Hello',
      html_content: '<p>Hi</p>',
      editor: 'code',
      active: 1,
    });
  });

  it('prefixes SMS names and keeps the body in plain_content', async () => {
    mockRequest
      .mockReturnValueOnce(reply({ id: ID }))
      .mockReturnValueOnce(reply({ id: 'v1' }))
      .mockReturnValueOnce(reply(template('[SMS] Order')));
    await gateway().create('sms', {
      name: 'Order',
      subject: '',
      html: '',
      text: 'Order {{orderNumber}}',
    });
    expect(mockRequest.mock.calls[0][0].body.name).toBe('[SMS] Order');
    expect(mockRequest.mock.calls[1][0].body).toMatchObject({
      plain_content: 'Order {{orderNumber}}',
      generate_plain_content: false,
    });
  });

  it('removes the empty template when the version is rejected', async () => {
    mockRequest
      .mockReturnValueOnce(reply({ id: ID }))
      .mockRejectedValueOnce(Object.assign(new Error('bad'), { code: 400 }))
      .mockReturnValueOnce(reply(undefined));
    await expect(
      gateway().create('email', {
        name: 'x',
        subject: 's',
        html: 'h',
        text: '',
      })
    ).rejects.toMatchObject({ code: 400 });
    expect(mockRequest.mock.calls[2][0]).toMatchObject({
      method: 'DELETE',
      url: `v3/templates/${ID}`,
    });
  });
});

describe('update', () => {
  it('renames the template and patches the active version without read-only fields', async () => {
    mockRequest
      .mockReturnValueOnce(reply(template('[SMS] Old')))
      .mockReturnValueOnce(reply({}))
      .mockReturnValueOnce(reply({}))
      .mockReturnValueOnce(reply(template('[SMS] New')));
    await gateway().update(ID, 'sms', {
      name: 'New',
      subject: '',
      html: '',
      text: 'New body',
    });
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      method: 'PATCH',
      url: `v3/templates/${ID}`,
      body: { name: '[SMS] New' },
    });
    const patch = mockRequest.mock.calls[2][0];
    expect(patch).toMatchObject({
      method: 'PATCH',
      url: `v3/templates/${ID}/versions/v1`,
    });
    expect(patch.body).not.toHaveProperty('editor');
    expect(patch.body).not.toHaveProperty('updated_at');
    expect(patch.body.plain_content).toBe('New body');
  });

  it('does not rename when the name is unchanged', async () => {
    mockRequest
      .mockReturnValueOnce(reply(template('Welcome')))
      .mockReturnValueOnce(reply({}))
      .mockReturnValueOnce(reply(template('Welcome')));
    await gateway().update(ID, 'email', {
      name: 'Welcome',
      subject: 's',
      html: 'h',
      text: '',
    });
    expect(mockRequest).toHaveBeenCalledTimes(3);
    expect(mockRequest.mock.calls[1][0].url).toContain('/versions/');
  });

  it('creates a version when the template has none', async () => {
    mockRequest
      .mockReturnValueOnce(reply(template('Welcome', [])))
      .mockReturnValueOnce(reply({}))
      .mockReturnValueOnce(reply(template('Welcome')));
    await gateway().update(ID, 'email', {
      name: 'Welcome',
      subject: 's',
      html: 'h',
      text: '',
    });
    expect(mockRequest.mock.calls[1][0]).toMatchObject({
      method: 'POST',
      url: `v3/templates/${ID}/versions`,
    });
  });

  it('refuses to change the type of a template', async () => {
    mockRequest.mockReturnValueOnce(reply(template('[SMS] Order')));
    await expect(
      gateway().update(ID, 'email', {
        name: 'x',
        subject: 's',
        html: 'h',
        text: '',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('remove', () => {
  it('deletes by ID', async () => {
    mockRequest.mockReturnValueOnce(reply(undefined));
    await gateway().remove(ID);
    expect(mockRequest.mock.calls[0][0]).toMatchObject({
      method: 'DELETE',
      url: `v3/templates/${ID}`,
    });
  });
});
