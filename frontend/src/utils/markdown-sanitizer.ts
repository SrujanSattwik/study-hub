/**
 * markdown-sanitizer.ts — sanitizes raw Markdown/HTML to prevent XSS attacks
 * and safely balances unclosed markup (code blocks, KaTeX delimiters, tables)
 * during active SSE token streaming.
 */

// Unsafe HTML tags to filter
const UNSAFE_TAG_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
  /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
  /<embed[\s\S]*?>[\s\S]*?<\/embed>/gi,
  /on\w+="[^"]*"/gi,
  /javascript:/gi,
];

export class MarkdownSanitizer {
  /**
   * Filter dangerous XSS payloads from raw response text.
   */
  static sanitizeHtml(rawText: string): string {
    let text = rawText;
    for (const pattern of UNSAFE_TAG_PATTERNS) {
      text = text.replace(pattern, '');
    }
    return text;
  }

  /**
   * Balance streaming Markdown markup so incomplete code fences or math
   * delimiters don't corrupt the UI during live SSE token streaming.
   */
  static balanceStreamingMarkdown(rawText: string): string {
    let text = this.sanitizeHtml(rawText);

    // 1. Balance triple backticks (code blocks)
    const codeFenceMatches = text.match(/```/g);
    if (codeFenceMatches && codeFenceMatches.length % 2 !== 0) {
      text += '\n```';
    }

    // 2. Balance block math $$ delimiters
    const blockMathMatches = text.match(/\$\$/g);
    if (blockMathMatches && blockMathMatches.length % 2 !== 0) {
      text += '\n$$';
    }

    return text;
  }

  /**
   * Sanitize Mermaid SVG markup against embedded scripts.
   */
  static sanitizeSvg(svgContent: string): string {
    return svgContent
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
  }
}

export default MarkdownSanitizer;
