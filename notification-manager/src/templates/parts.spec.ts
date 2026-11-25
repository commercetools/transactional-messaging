import {
  includedKeys,
  includeTag,
  keyOfPath,
  newPartKey,
  parsePart,
  partBody,
  partsAffectedBy,
  partsIncluding,
  resolveIncludes,
  slugOf,
  templatesUsingPart,
  wrapPart,
  type TemplatePart,
} from './parts';

const part = (key: string, mjml: string): TemplatePart => ({
  schemaVersion: 1,
  key,
  name: key,
  notification: 'order-confirmation',
  mjml,
});

describe('keys and paths', () => {
  it('turns a name into a readable key', () => {
    expect(slugOf('Order summary (Café)')).toBe('order-summary-cafe');
    expect(slugOf('!!!')).toBe('part');
  });

  it('never reuses an existing key', () => {
    expect(newPartKey('Footer', [])).toBe('footer');
    expect(newPartKey('Footer', ['footer', 'footer-2'])).toBe('footer-3');
  });

  it('reads the key from an include path', () => {
    expect(keyOfPath('footer.mjml')).toBe('footer');
    expect(keyOfPath('./parts/footer.mjml')).toBe('footer');
    expect(keyOfPath('footer')).toBe('footer');
    expect(includeTag('footer')).toBe('<mj-include path="footer.mjml" />');
  });

  it('finds includes in any quoting and closing style', () => {
    expect(
      includedKeys(
        `<mj-include path="a.mjml"/><mj-include path='b.mjml'></mj-include><mj-include type="mjml" path="c" >`
      )
    ).toEqual(['a', 'b', 'c']);
  });
});

describe('parsePart', () => {
  it('accepts a stored part and rejects anything else', () => {
    expect(
      parsePart('footer', {
        schemaVersion: 1,
        name: 'Footer',
        notification: 'order-confirmation',
        mjml: '<mj-section/>',
      })
    ).toMatchObject({ key: 'footer', name: 'Footer' });
    expect(
      parsePart('x', { schemaVersion: 1, name: 'X', mjml: '' })
    ).toBeUndefined();
    expect(parsePart('x', null)).toBeUndefined();
  });
});

describe('resolveIncludes', () => {
  const parts = new Map([
    ['footer', '<mj-section>footer</mj-section>'],
    ['outer', '<mj-wrapper><mj-include path="footer.mjml" /></mj-wrapper>'],
    [
      'doc',
      '<mjml><mj-body width="600px"><mj-section>doc</mj-section></mj-body></mjml>',
    ],
    ['loop-a', '<mj-include path="loop-b.mjml" />'],
    ['loop-b', '<mj-include path="loop-a.mjml" />'],
  ]);

  it('replaces includes, also inside parts', () => {
    const result = resolveIncludes(
      '<mjml><mj-body><mj-include path="outer.mjml" /></mj-body></mjml>',
      parts
    );
    expect(result.errors).toEqual([]);
    expect(result.mjml).toBe(
      '<mjml><mj-body><mj-wrapper><mj-section>footer</mj-section></mj-wrapper></mj-body></mjml>'
    );
    expect(result.used.sort()).toEqual(['footer', 'outer']);
  });

  it('includes only the body of a part written as a whole document', () => {
    expect(resolveIncludes('<mj-include path="doc.mjml"/>', parts).mjml).toBe(
      '<mj-section>doc</mj-section>'
    );
    expect(partBody('<mjml><mj-section/></mjml>')).toBe('<mj-section/>');
  });

  it('reports missing parts, loops, and non-MJML includes', () => {
    expect(
      resolveIncludes('<mj-include path="x.mjml" />', parts).errors
    ).toEqual(['There is no part "x".']);
    expect(
      resolveIncludes('<mj-include path="loop-a.mjml" />', parts).errors[0]
    ).toMatch(/includes itself/);
    expect(
      resolveIncludes('<mj-include path="footer.mjml" />', parts, 'footer')
        .errors[0]
    ).toMatch(/includes itself/);
    expect(
      resolveIncludes('<mj-include path="a.css" type="css" />', parts).errors[0]
    ).toMatch(/Only MJML/);
  });

  it('wraps a fragment for the preview, but not a document', () => {
    expect(wrapPart('<mj-section/>')).toBe(
      '<mjml><mj-body><mj-section/></mj-body></mjml>'
    );
    expect(wrapPart('<mjml></mjml>')).toBe('<mjml></mjml>');
  });
});

describe('usage', () => {
  const parts = [
    part('footer', '<mj-section/>'),
    part('outer', '<mj-include path="footer.mjml" />'),
    part('other', '<mj-section/>'),
  ];
  const sources = [
    { id: 'direct', mjml: '<mj-include path="footer.mjml" />' },
    { id: 'nested', mjml: '<mj-include path="outer.mjml" />' },
    { id: 'none', mjml: '<mj-section/>' },
    { id: 'sms' },
  ];

  it('finds the templates that use a part directly or through another part', () => {
    expect([...partsAffectedBy('footer', parts)].sort()).toEqual([
      'footer',
      'outer',
    ]);
    expect(templatesUsingPart('footer', parts, sources)).toEqual([
      'direct',
      'nested',
    ]);
    expect(templatesUsingPart('other', parts, sources)).toEqual([]);
  });

  it('lists the parts that include a part', () => {
    expect(partsIncluding('footer', parts).map((p) => p.key)).toEqual([
      'outer',
    ]);
  });
});
