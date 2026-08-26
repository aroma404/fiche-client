export function normalizeAlgerianWhatsApp(value: string) {
  const compact = value.replace(/[^\d+]/g, "");
  if (!compact) return "";
  if (compact.startsWith("+213")) return compact.slice(1);
  if (compact.startsWith("213")) return compact;
  if (compact.startsWith("0")) return `213${compact.slice(1)}`;
  return `213${compact}`;
}

export function phoneDialLink(value: string) {
  const compact = value.replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : "";
}

export function emailComposeLink(value: string) {
  const email = value.trim();
  return email ? `mailto:${email}` : "";
}
