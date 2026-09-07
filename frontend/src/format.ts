/** Formats a raw numeric string ("5000000" or "12.5") with space thousand separators. */
export function formatThousands(raw: string): string {
  if (!raw) return '';
  const negative = raw.startsWith('-');
  const [intPart, decPart] = raw.replace('-', '').split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const withDecimal = decPart !== undefined ? `${grouped}.${decPart}` : grouped;
  return negative ? `-${withDecimal}` : withDecimal;
}

/** Strips display formatting (spaces, stray characters) back down to a plain numeric string. */
export function sanitizeNumericInput(value: string, allowDecimal: boolean): string {
  const stripped = value.replace(/\s/g, '').replace(',', '.');
  const cleaned = stripped.replace(allowDecimal ? /[^\d.]/g : /[^\d]/g, '');
  if (!allowDecimal) return cleaned;
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}
