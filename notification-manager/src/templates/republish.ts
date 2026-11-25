import type { TemplateApi } from '../api/template-api';
import { compileMjml, type loadMjml } from './preview';
import { partMap, resolveIncludes, type TemplatePart } from './parts';

type Compiler = Awaited<ReturnType<typeof loadMjml>>;

export type RepublishResult = {
  updated: string[];
  failed: Array<{ id: string; message: string }>;
};

/**
 * SendGrid stores compiled HTML, with every part already copied in. After a part changes, each template that
 * uses it is compiled again from its stored MJML and saved, so what is sent matches the part.
 */
export const republishTemplates = async ({
  ids,
  mjmlById,
  parts,
  api,
  compile,
}: {
  ids: ReadonlyArray<string>;
  mjmlById: ReadonlyMap<string, string | undefined>;
  parts: ReadonlyArray<TemplatePart>;
  api: Pick<TemplateApi, 'get' | 'update'>;
  compile: Compiler;
}): Promise<RepublishResult> => {
  const available = partMap(parts);
  const result: RepublishResult = { updated: [], failed: [] };
  // One at a time: SendGrid rate-limits template writes, and the list is short.
  for (const id of ids) {
    try {
      const mjml = mjmlById.get(id);
      if (mjml === undefined) throw new Error('Its MJML is not stored.');
      const resolved = resolveIncludes(mjml, available);
      if (resolved.errors.length > 0)
        throw new Error(resolved.errors.join(' '));
      const compiled = compileMjml(compile, resolved.mjml);
      if (compiled.html === undefined)
        throw new Error(compiled.errors.join(' '));
      const detail = await api.get(id);
      await api.update(id, {
        channel: 'email',
        name: detail.name,
        subject: detail.subject,
        html: compiled.html,
        text: '',
      });
      result.updated.push(id);
    } catch (error) {
      result.failed.push({
        id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return result;
};
