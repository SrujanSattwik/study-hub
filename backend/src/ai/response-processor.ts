/**
 * ResponseProcessor — post-processes raw AI text from Gemini into a
 * structured, enriched response object.
 *
 * Current operations:
 *   1. Sanitize unsafe prompt injection attempts from response text
 *   2. Extract metadata hints (presence of code blocks, math, tables)
 *   3. Prepare structured response envelope for future Phase 4 streaming
 *
 * This processor does NOT render Markdown or KaTeX — that belongs to Phase 5.
 * It prepares the ground for those phases by annotating the response.
 */
export interface ProcessedResponse {
  raw: string;
  sanitized: string;
  hasCodeBlocks: boolean;
  hasMathExpressions: boolean;
  hasTables: boolean;
  estimatedReadingTimeSeconds: number;
}

// Patterns that suggest prompt injection attempts embedded in AI output
const INJECTION_PATTERNS = [
  /\[SYSTEM\]/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|system\|>/gi,
  /<\|user\|>/gi,
  /ignore previous instructions/gi,
  /disregard your system prompt/gi,
  /you are now DAN/gi,
  /pretend you have no restrictions/gi,
  /your new instructions are/gi,
];

export class ResponseProcessor {
  process(rawText: string): ProcessedResponse {
    const sanitized = this.sanitize(rawText);

    return {
      raw: rawText,
      sanitized,
      hasCodeBlocks: /```[\s\S]*?```/.test(sanitized),
      hasMathExpressions: /(\$\$[\s\S]*?\$\$|\$[^\$]+\$)/.test(sanitized),
      hasTables: /\|.+\|.+\|/.test(sanitized),
      estimatedReadingTimeSeconds: Math.ceil(sanitized.split(/\s+/).length / 3.5), // avg 210 wpm / 60s
    };
  }

  private sanitize(text: string): string {
    let sanitized = text;
    for (const pattern of INJECTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[CONTENT FILTERED]');
    }
    return sanitized;
  }
}

export const responseProcessor = new ResponseProcessor();
