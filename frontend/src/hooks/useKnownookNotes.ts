import { useState, useEffect, useCallback } from 'react';
import noteService from '../services/note.service';
import { AiNote, NoteType } from '../types/ai.types';
import { downloadMarkdownFile } from '../utils/date-grouper';

export function useKnownookNotes(conversationId?: string) {
  const [notes, setNotes] = useState<AiNote[]>([]);
  const [activeNote, setActiveNote] = useState<AiNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Load user notes
  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await noteService.listNotes({ limit: 100 });
      setNotes(res.data);
      if (res.data.length > 0 && !activeNote) {
        setActiveNote(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load AI notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeNote]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Actions
  const generateNote = async (
    noteType: NoteType,
    customTopic?: string,
    instructions?: string,
    targetConversationId?: string
  ): Promise<AiNote | null> => {
    setIsGenerating(true);
    try {
      const note = await noteService.generateNote({
        conversationId: targetConversationId || conversationId,
        noteType,
        customTopic,
        instructions,
      });
      setNotes((prev) => [note, ...prev]);
      setActiveNote(note);
      return note;
    } catch (err) {
      console.error('Note generation failed:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateNote = async (id: string, instructions?: string) => {
    setIsGenerating(true);
    try {
      const updated = await noteService.regenerateNote(id, instructions);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      if (activeNote?.id === id) setActiveNote(updated);
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateNote = async (id: string, data: { title?: string; content?: string; tags?: string }) => {
    try {
      const updated = await noteService.updateNote(id, data);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      if (activeNote?.id === id) setActiveNote(updated);
    } catch (err) {
      console.error('Note update failed:', err);
    }
  };

  const toggleFavorite = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    try {
      const updated = await noteService.toggleFavorite(id, !target.isFavorite);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      if (activeNote?.id === id) setActiveNote(updated);
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await noteService.deleteNote(id);
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      if (activeNote?.id === id) {
        setActiveNote(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error('Note deletion failed:', err);
    }
  };

  const exportToMarkdown = (note: AiNote) => {
    const safeTitle = note.title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    downloadMarkdownFile(`${safeTitle}_note.md`, `# ${note.title}\n\n${note.content}`);
  };

  const exportToPdf = (note: AiNote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${note.title} - KnowNook AI Note</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111827; line-height: 1.6; }
            h1 { color: #0284c7; border-bottom: 2px solid #e0f2fe; padding-bottom: 12px; }
            pre { background: #f3f4f6; padding: 16px; border-radius: 8px; font-family: monospace; overflow-x: auto; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
            blockquote { border-left: 4px solid #0284c7; padding-left: 16px; color: #4b5563; margin-left: 0; }
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
            th { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>${note.title}</h1>
          <p style="color: #6b7280; font-size: 12px;">Type: ${note.noteType.toUpperCase()} | Generated: ${new Date(note.createdAt).toLocaleString()}</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <div>${note.content.replace(/\n/g, '<br />')}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Filtered notes list
  const filteredNotes = notes.filter((n) => {
    if (filterType === 'favorite' && !n.isFavorite) return false;
    if (filterType === 'mindmap' && n.noteType !== 'mindmap') return false;
    if (filterType === 'summary' && n.noteType !== 'executive_summary') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchTags = n.tags?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchTags) return false;
    }
    return true;
  });

  return {
    notes: filteredNotes,
    allNotes: notes,
    activeNote,
    setActiveNote,
    isLoading,
    isGenerating,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    generateNote,
    regenerateNote,
    updateNote,
    toggleFavorite,
    deleteNote,
    exportToMarkdown,
    exportToPdf,
    refreshNotes: loadNotes,
  };
}
