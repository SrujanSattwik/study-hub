import { geminiClient } from '../ai/gemini-client';
import { aiMessageRepository } from '../repositories/ai-message.repository';
import { NoteType } from '../types/ai.types';
import { logger } from '../utils/logger';

export class AiNoteGeneratorService {
  /**
   * Build specific instruction prompt based on note format type.
   */
  private buildInstructionPrompt(noteType: NoteType, topic?: string, customInstructions?: string): string {
    const topicHeading = topic ? `Topic Focus: "${topic}"` : 'Topic: Current Study Session Context';
    const userPrompt = customInstructions ? `Additional User Instructions: ${customInstructions}` : '';

    switch (noteType) {
      case 'executive_summary':
        return `Format: EXECUTIVE SUMMARY
Task: Create a high-level, clear Executive Summary of the study materials.
Include:
- Core Objective / Overview
- Key Architectural or Concept Highlights
- Practical Implications
${topicHeading}
${userPrompt}`;

      case 'bullet':
        return `Format: BULLET POINT REVISION
Task: Create concise, scannable bullet points covering every major concept.
Include:
- Key Facts
- Core Principles
- Quick Summary Checkpoints
${topicHeading}
${userPrompt}`;

      case 'revision':
        return `Format: QUICK REVISION SHEET
Task: Build an intensive quick revision guide for rapid review before tests.
Include:
- Must-Know Concepts
- Critical Pitfalls & Common Mistakes
- Quick Recall Questions & Answers
${topicHeading}
${userPrompt}`;

      case 'exam':
        return `Format: HIGH-YIELD EXAM CHEAT SHEET
Task: Synthesize a high-yield exam cheat sheet.
Include:
- Core Definitions
- Essential Formulas ($...$ or $$...$$)
- Expected Exam Questions & Solutions
${topicHeading}
${userPrompt}`;

      case 'eli5':
        return `Format: EXPLAIN LIKE I'M 5 (ELI5)
Task: Explain the topic using simple language, clear everyday analogies, and no jargon.
${topicHeading}
${userPrompt}`;

      case 'definitions':
        return `Format: DEFINITIONS & TERMINOLOGY INDEX
Task: Extract and define all key terms, acronyms, and technical definitions in a clean table format.
${topicHeading}
${userPrompt}`;

      case 'formulas':
        return `Format: FORMULA & EQUATION SHEET
Task: Extract all mathematical formulas, scientific equations, and proofs. Format math with LaTeX ($...$ and $$...$$).
Include formula name, LaTeX expression, variable definitions, and sample usage.
${topicHeading}
${userPrompt}`;

      case 'mindmap':
        return `Format: MIND MAP DIAGRAM (MERMAID SVG)
Task: Create a hierarchical visual Mind Map using valid Mermaid diagram syntax inside a \`\`\`mermaid\`\`\` block.
Example:
\`\`\`mermaid
mindmap
  root((Study Topic))
    Section A
      Subtopic 1
      Subtopic 2
    Section B
      Concept 1
\`\`\`
Ensure valid Mermaid syntax with NO syntax errors.
${topicHeading}
${userPrompt}`;

      case 'detailed':
      case 'smart':
      default:
        return `Format: COMPREHENSIVE DETAILED STUDY NOTES
Task: Generate well-structured, comprehensive study notes in Markdown format.
Include:
- Section Headings (##, ###)
- Clear Explanations & Examples
- Formulas ($...$) where appropriate
- Summary Table or Code Snippets
${topicHeading}
${userPrompt}`;
    }
  }

  /**
   * Generate an AI Note for a conversation thread.
   */
  async generateNote(
    userId: string,
    conversationId: string | undefined,
    noteType: NoteType,
    customTopic?: string,
    instructions?: string
  ): Promise<{ title: string; content: string; summary: string }> {
    logger.info(`[AI NOTE GENERATOR] Generating ${noteType} note for user ${userId}`);

    let contextText = '';
    if (conversationId) {
      try {
        const history = await aiMessageRepository.listByConversation(conversationId, { limit: 20 });
        contextText = history.data
          .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n');
      } catch (err: any) {
        logger.warn(`[AI NOTE GENERATOR] Could not retrieve conversation memory: ${err.message}`);
      }
    }

    const typeInstruction = this.buildInstructionPrompt(noteType, customTopic, instructions);

    const systemInstruction = `You are KnowNook AI, an enterprise study assistant and academic note writer.
Your job is to transform study conversations and materials into publication-quality study notes.
Use GitHub-Flavored Markdown formatting with headers, tables, code blocks, KaTeX math ($...$ / $$...$$), and Mermaid diagrams (\`\`\`mermaid) when appropriate.
Provide a clear, engaging title at the top as an # H1 Heading.`;

    const fullPrompt = `${typeInstruction}

Context Data:
${contextText || 'No attached conversation context. Rely on topic prompt.'}

Please generate the complete study note now.`;

    // Call Gemini Client with retry engine
    const response = await geminiClient.generate({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      estimatedPromptTokens: 0,
    });

    const rawAnswer = response.answer;

    // Extract title from H1 heading if present
    let title = `${noteType.replace('_', ' ').toUpperCase()} Note`;
    const titleMatch = rawAnswer.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else if (customTopic) {
      title = `${customTopic} (${noteType.replace('_', ' ')})`;
    }

    // Extract first 150 characters for summary
    const summary = rawAnswer.replace(/^#+ .+/g, '').replace(/[\n\r#*`]/g, ' ').trim().slice(0, 150);

    return {
      title,
      content: rawAnswer,
      summary,
    };
  }
}

export const aiNoteGeneratorService = new AiNoteGeneratorService();
export default aiNoteGeneratorService;
