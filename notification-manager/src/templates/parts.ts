import {
  isNotificationKey,
  type NotificationKey,
} from '../shared/notifications/keys';

/**
 * A part is a reusable MJML fragment, bound to one notification so it can use that notification's variables.
 * Templates pull it in with `<mj-include path="<key>.mjml" />`.
 *
 * SendGrid has no includes, so parts never reach SendGrid themselves: the Merchant Center replaces each
 * `mj-include` with the part's MJML before it compiles a template. Saving a part therefore saves again every
 * template that uses it (see republish.ts).
 */
export type TemplatePart = {
  schemaVersion: 1;
  /** Custom Object key, fixed when the part is created. Also the include path, without `.mjml`. */
  key: string;
  name: string;
  notification: NotificationKey;
  mjml: string;
  updatedAt?: string;
};

export const MAX_INCLUDE_DEPTH = 10;

export const parsePart = (
  key: string,
  value: unknown,
  updatedAt?: string
): TemplatePart | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.name !== 'string' ||
    typeof candidate.mjml !== 'string' ||
    !isNotificationKey(candidate.notification)
  ) {
    return undefined;
  }
  return {
    schemaVersion: 1,
    key,
    name: candidate.name,
    notification: candidate.notification,
    mjml: candidate.mjml,
    ...(updatedAt ? { updatedAt } : {}),
  };
};

/** What is stored in the Custom Object (the key is the object's own key). */
export const partValue = (part: TemplatePart) => ({
  schemaVersion: 1 as const,
  name: part.name,
  notification: part.notification,
  mjml: part.mjml,
});

/** Lower-case letters, digits and dashes, so the key is a valid Custom Object key and a readable path. */
export const slugOf = (name: string): string =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '') || 'part';

/** A key for a new part that no existing part uses. Writes are upserts, so a clash would overwrite a part. */
export const newPartKey = (
  name: string,
  existingKeys: Iterable<string>
): string => {
  const taken = new Set(existingKeys);
  const base = slugOf(name);
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
};

export const includeTag = (key: string): string =>
  `<mj-include path="${key}.mjml" />`;

// <mj-include path="x.mjml" />, <mj-include path='x'></mj-include>, with other attributes in any order.
const INCLUDE = /<mj-include\b([^>]*?)\/?>(?:\s*<\/mj-include>)?/gi;
const ATTRIBUTE = (name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');

const attribute = (attributes: string, name: string): string | undefined => {
  const match = ATTRIBUTE(name).exec(attributes);
  return match ? match[1] ?? match[2] : undefined;
};

/** `./parts/order-summary.mjml` → `order-summary`. The folder is ignored: parts live in one flat list. */
export const keyOfPath = (path: string): string =>
  path
    .trim()
    .replace(/^.*\//, '')
    .replace(/\.mjml$/i, '');

/** Keys of the parts that `mjml` includes directly. */
export const includedKeys = (mjml: string): string[] => {
  const keys: string[] = [];
  for (const match of mjml.matchAll(INCLUDE)) {
    const path = attribute(match[1] ?? '', 'path');
    if (path) keys.push(keyOfPath(path));
  }
  return keys;
};

/** A part may be written as a whole MJML document; only what is inside `mj-body` is included. */
export const partBody = (mjml: string): string => {
  const body = /<mj-body\b[^>]*>([\s\S]*?)<\/mj-body>/i.exec(mjml);
  if (body) return body[1];
  return mjml.replace(/<\/?mjml\b[^>]*>/gi, '');
};

/** A part on its own is a fragment; this makes it a document the compiler accepts, for the preview. */
export const wrapPart = (mjml: string): string =>
  /<mjml\b/i.test(mjml) ? mjml : `<mjml><mj-body>${mjml}</mj-body></mjml>`;

export type Resolved = { mjml: string; errors: string[]; used: string[] };

/**
 * Replaces every `mj-include` with the MJML of the part it names, including parts included by parts.
 * An unknown part, a non-MJML include or a loop is reported, and that include is removed.
 * `root` is the key of the part being resolved, if it is a part, so a part that includes itself is caught.
 */
export const resolveIncludes = (
  source: string,
  parts: ReadonlyMap<string, string>,
  root?: string
): Resolved => {
  const errors: string[] = [];
  const used = new Set<string>();

  const expand = (mjml: string, chain: string[]): string =>
    mjml.replace(INCLUDE, (_tag, attributes: string) => {
      const path = attribute(attributes, 'path');
      const type = attribute(attributes, 'type');
      if (!path) {
        errors.push('An mj-include has no path.');
        return '';
      }
      if (type && type.toLowerCase() !== 'mjml') {
        errors.push(`Only MJML parts can be included ("${path}").`);
        return '';
      }
      const key = keyOfPath(path);
      if (chain.includes(key)) {
        errors.push(
          `The part "${key}" includes itself (${[...chain, key].join(' → ')}).`
        );
        return '';
      }
      if (chain.length >= MAX_INCLUDE_DEPTH) {
        errors.push(
          `Parts are nested more than ${MAX_INCLUDE_DEPTH} levels deep.`
        );
        return '';
      }
      const part = parts.get(key);
      if (part === undefined) {
        errors.push(`There is no part "${key}".`);
        return '';
      }
      used.add(key);
      return expand(partBody(part), [...chain, key]);
    });

  return {
    mjml: expand(source, root ? [root] : []),
    errors,
    used: [...used],
  };
};

export const partMap = (
  parts: ReadonlyArray<TemplatePart>
): Map<string, string> => new Map(parts.map((part) => [part.key, part.mjml]));

/** The part itself and every part that includes it, directly or through other parts. */
export const partsAffectedBy = (
  key: string,
  parts: ReadonlyArray<TemplatePart>
): Set<string> => {
  const affected = new Set([key]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const part of parts) {
      if (affected.has(part.key)) continue;
      if (includedKeys(part.mjml).some((included) => affected.has(included))) {
        affected.add(part.key);
        grew = true;
      }
    }
  }
  return affected;
};

/** IDs of the templates whose MJML uses the part, directly or through other parts. */
export const templatesUsingPart = (
  key: string,
  parts: ReadonlyArray<TemplatePart>,
  sources: ReadonlyArray<{ id: string; mjml?: string }>
): string[] => {
  const affected = partsAffectedBy(key, parts);
  return sources
    .filter(
      (source) =>
        source.mjml !== undefined &&
        includedKeys(source.mjml).some((included) => affected.has(included))
    )
    .map((source) => source.id);
};

/** Names of the other parts that include this one directly. */
export const partsIncluding = (
  key: string,
  parts: ReadonlyArray<TemplatePart>
): TemplatePart[] =>
  parts.filter(
    (part) => part.key !== key && includedKeys(part.mjml).includes(key)
  );

export const DEFAULT_PART_MJML = `<mj-section>
  <mj-column>
    <mj-text>
      Write the reusable block here. It can use the variables of its notification.
    </mj-text>
  </mj-column>
</mj-section>
`;
