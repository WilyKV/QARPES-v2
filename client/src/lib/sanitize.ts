import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}
