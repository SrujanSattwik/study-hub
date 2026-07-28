import aiNoteRepository from '../repositories/ai-note.repository';
import aiNoteGeneratorService from './ai-note-generator.service';
import { AiNote } from '@prisma/client';
import { GenerateNoteDTO, CreateNoteDTO, UpdateNoteDTO, PaginatedResult } from '../types/ai.types';

export class AiNoteService {
  /**
   * Generate an AI Note using Gemini and persist to database.
   */
  async generateNote(userId: string, data: GenerateNoteDTO): Promise<AiNote> {
    const generated = await aiNoteGeneratorService.generateNote(
      userId,
      data.conversationId,
      data.noteType,
      data.customTopic,
      data.instructions
    );

    return aiNoteRepository.create({
      userId,
      conversationId: data.conversationId,
      title: generated.title,
      noteType: data.noteType,
      content: generated.content,
      summary: generated.summary,
      tags: data.customTopic || data.noteType,
      isFavorite: false,
    });
  }

  /**
   * Create a manual note.
   */
  async createNote(userId: string, data: CreateNoteDTO): Promise<AiNote> {
    return aiNoteRepository.create({
      ...data,
      userId,
    });
  }

  /**
   * Get note details by ID.
   */
  async getNoteById(id: string): Promise<AiNote | null> {
    return aiNoteRepository.findById(id);
  }

  /**
   * List notes for a user with filters.
   */
  async listNotes(
    userId: string,
    params: {
      conversationId?: string;
      isFavorite?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResult<AiNote>> {
    return aiNoteRepository.findMany({
      userId,
      ...params,
    });
  }

  /**
   * Update a note.
   */
  async updateNote(id: string, data: UpdateNoteDTO): Promise<AiNote> {
    return aiNoteRepository.update(id, data);
  }

  /**
   * Delete a note.
   */
  async deleteNote(id: string): Promise<void> {
    await aiNoteRepository.delete(id);
  }

  /**
   * Regenerate note content using AI generator.
   */
  async regenerateNote(id: string, instructions?: string): Promise<AiNote> {
    const existing = await aiNoteRepository.findById(id);
    if (!existing) {
      throw new Error('Note not found');
    }

    const generated = await aiNoteGeneratorService.generateNote(
      existing.userId,
      existing.conversationId || undefined,
      existing.noteType as any,
      existing.title,
      instructions
    );

    return aiNoteRepository.update(id, {
      title: generated.title,
      content: generated.content,
      summary: generated.summary,
    });
  }
}

export const aiNoteService = new AiNoteService();
export default aiNoteService;
