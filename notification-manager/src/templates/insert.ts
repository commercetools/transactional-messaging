/** Inserts `token` where the selection is, replacing the selected text, and reports the new cursor position. */
export const insertAtSelection = (
  value: string,
  selectionStart: number | null | undefined,
  selectionEnd: number | null | undefined,
  token: string
): { value: string; cursor: number } => {
  const length = value.length;
  const start = Math.min(Math.max(selectionStart ?? length, 0), length);
  const end = Math.min(Math.max(selectionEnd ?? start, start), length);
  return {
    value: value.slice(0, start) + token + value.slice(end),
    cursor: start + token.length,
  };
};
