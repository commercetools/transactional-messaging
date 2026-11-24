declare module 'mjml-browser' {
  type MjmlError = { line: number; message: string; tagName: string };
  type MjmlResult = { html: string; errors: MjmlError[] };
  export default function mjml2html(
    source: string,
    options?: { validationLevel?: 'strict' | 'soft' | 'skip'; minify?: boolean }
  ): MjmlResult;
}
