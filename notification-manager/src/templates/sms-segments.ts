/** Approximate SMS segments: GSM-7 holds 160 characters (153 per part), UCS-2 holds 70 (67 per part). */
export const estimateSms = (
  text: string
): { length: number; segments: number; encoding: 'GSM-7' | 'UCS-2' } => {
  const encoding = /[^\x20-\x7E\n£¥èéùìòÇØøÅå€]/.test(text) ? 'UCS-2' : 'GSM-7';
  const single = encoding === 'GSM-7' ? 160 : 70;
  const multi = encoding === 'GSM-7' ? 153 : 67;
  const length = text.length;
  const segments =
    length === 0 ? 0 : length <= single ? 1 : Math.ceil(length / multi);
  return { length, segments, encoding };
};
