export function sanitizeNumberInput(raw: string): string {
  let cleaned = raw.replace(/[^0-9.,]/g, '');
  const firstComma = cleaned.indexOf(',');
  const firstDot = cleaned.indexOf('.');
  const firstSep =
    firstComma === -1 ? firstDot : firstDot === -1 ? firstComma : Math.min(firstComma, firstDot);
  if (firstSep !== -1) {
    const before = cleaned.slice(0, firstSep + 1);
    const after = cleaned.slice(firstSep + 1).replace(/[.,]/g, '');
    cleaned = before + after;
  }
  return cleaned;
}
