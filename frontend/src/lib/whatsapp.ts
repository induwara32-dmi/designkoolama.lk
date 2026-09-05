const DEFAULT_WHATSAPP_NUMBER = "94763536554";

export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, "");

export function buildWhatsAppLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function joinWhatsAppMessage(lines: Array<string | false | null | undefined>) {
  return lines.filter((line): line is string => Boolean(line)).join("\n");
}
