import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br", "hr",
  "strong", "em", "u", "s", "sub", "sup",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th",
  "code", "pre",
  "blockquote",
  "span", "div",
  "img",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  "*": ["class", "style"],
};

// Regex rejecting any value containing javascript: or expression()
const SAFE_STYLE_VALUE = /^(?!.*javascript:)(?!.*expression\().*$/i;

const ALLOWED_STYLES: sanitizeHtml.IOptions["allowedStyles"] = {
  "*": {
    color: [SAFE_STYLE_VALUE],
    "background-color": [SAFE_STYLE_VALUE],
    background: [SAFE_STYLE_VALUE],
    "font-size": [SAFE_STYLE_VALUE],
    "font-family": [SAFE_STYLE_VALUE],
    "font-weight": [SAFE_STYLE_VALUE],
    "font-style": [SAFE_STYLE_VALUE],
    "text-align": [SAFE_STYLE_VALUE],
    "text-decoration": [SAFE_STYLE_VALUE],
    margin: [SAFE_STYLE_VALUE],
    padding: [SAFE_STYLE_VALUE],
    border: [SAFE_STYLE_VALUE],
    width: [SAFE_STYLE_VALUE],
    height: [SAFE_STYLE_VALUE],
  },
};

export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    disallowedTagsMode: "discard",
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, rel: "noopener noreferrer" },
      }),
    },
  });
}
