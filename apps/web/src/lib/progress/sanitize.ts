import DOMPurify from "dompurify";

/**
 * Allowed HTML elements that Tiptap produces.
 * Anything not in this list is stripped.
 */
const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "h4",
  "strong", "b", "em", "i", "u", "s", "del",
  "code", "pre", "blockquote",
  "ul", "ol", "li",
  "a", "hr", "br", "mark",
  "input", "label", "div", "span",
];

const ALLOWED_ATTR = [
  "href", "target", "rel", "class", "data-type", "data-checked",
  "type", "checked", "disabled", "data-placeholder",
];

/**
 * Sanitize HTML content from Tiptap or IndexedDB before rendering.
 * Strips XSS vectors while preserving rich text formatting.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}

/**
 * Convert HTML to Markdown.
 * Uses DOMPurify to sanitize before parsing to prevent
 * DOM-based injection via image beacons or event handlers.
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>") return "";

  const clean = sanitizeHtml(html);
  const div = document.createElement("div");
  div.innerHTML = clean;

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const el = node as HTMLElement;
    const children = Array.from(el.childNodes).map(processNode).join("");

    switch (el.tagName.toLowerCase()) {
      case "p": return children + "\n\n";
      case "h1": return `# ${children}\n\n`;
      case "h2": return `## ${children}\n\n`;
      case "h3": return `### ${children}\n\n`;
      case "h4": return `#### ${children}\n\n`;
      case "strong": case "b": return `**${children}**`;
      case "em": case "i": return `*${children}*`;
      case "u": return `<u>${children}</u>`;
      case "s": case "del": return `~~${children}~~`;
      case "code":
        if (el.parentElement?.tagName.toLowerCase() === "pre") return children;
        return `\`${children}\``;
      case "pre": {
        const codeEl = el.querySelector("code");
        const lang = codeEl?.className.match(/language-(\w+)/)?.[1] ?? "";
        const code = codeEl?.textContent ?? children;
        return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
      }
      case "blockquote":
        return children.trim().split("\n").map((l) => `> ${l}`).join("\n") + "\n\n";
      case "ul": case "ol": return children + "\n";
      case "li": {
        const parent = el.parentElement;
        if (parent?.tagName.toLowerCase() === "ol") {
          return `${Array.from(parent.children).indexOf(el) + 1}. ${children.trim()}\n`;
        }
        const cb = el.querySelector('input[type="checkbox"]');
        if (cb) return `- [${(cb as HTMLInputElement).checked ? "x" : " "}] ${children.replace(/^\s+/, "").trim()}\n`;
        return `- ${children.trim()}\n`;
      }
      case "a": {
        const href = el.getAttribute("href") ?? "";
        return `[${children}](${href})`;
      }
      case "hr": return "---\n\n";
      case "br": return "\n";
      case "mark": return `==${children}==`;
      default: return children;
    }
  }

  return processNode(div).trim() + "\n";
}
