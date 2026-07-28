import { AiConversation, AiMessage } from '../types/ai.types';

export interface GroupedConversations {
  today: AiConversation[];
  yesterday: AiConversation[];
  last7Days: AiConversation[];
  last30Days: AiConversation[];
  older: AiConversation[];
}

/**
 * Group active workspace conversations by relative last updated date.
 */
export function groupConversationsByDate(conversations: AiConversation[]): GroupedConversations {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const last7DaysStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const last30DaysStart = todayStart - 30 * 24 * 60 * 60 * 1000;

  const grouped: GroupedConversations = {
    today: [],
    yesterday: [],
    last7Days: [],
    last30Days: [],
    older: [],
  };

  for (const conv of conversations) {
    const time = new Date(conv.lastMessageAt || conv.createdAt).getTime();

    if (time >= todayStart) {
      grouped.today.push(conv);
    } else if (time >= yesterdayStart) {
      grouped.yesterday.push(conv);
    } else if (time >= last7DaysStart) {
      grouped.last7Days.push(conv);
    } else if (time >= last30DaysStart) {
      grouped.last30Days.push(conv);
    } else {
      grouped.older.push(conv);
    }
  }

  return grouped;
}

/**
 * Format timestamp relative to current time ("2m ago", "1h ago", "Yesterday", "Jul 28").
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Trigger a browser file download for Markdown content.
 */
export function downloadMarkdownFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.md') ? filename : `${filename}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a single conversation and its messages to Markdown.
 */
export function exportConversationToMarkdown(title: string, messages: AiMessage[]): void {
  const lines: string[] = [
    `# StudyHub KnowNook AI Conversation: ${title}`,
    `*Exported on ${new Date().toLocaleString()}*`,
    `---`,
    '',
  ];

  for (const msg of messages) {
    const roleName = msg.role === 'user' ? 'Student' : 'KnowNook AI';
    const timestamp = new Date(msg.createdAt).toLocaleString();
    lines.push(`### ${roleName} (${timestamp})`);
    lines.push(msg.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  const safeFilename = title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  downloadMarkdownFile(`${safeFilename}_history.md`, lines.join('\n'));
}

/**
 * Export a summary digest of multiple selected conversations.
 */
export function exportBulkConversationsToMarkdown(conversations: AiConversation[]): void {
  const lines: string[] = [
    `# StudyHub KnowNook Workspace Export Digest`,
    `*Exported ${conversations.length} conversation(s) on ${new Date().toLocaleString()}*`,
    `---`,
    '',
  ];

  for (const conv of conversations) {
    lines.push(`## ${conv.title}`);
    lines.push(`- **ID:** ${conv.id}`);
    lines.push(`- **Total Messages:** ${conv.totalMessages}`);
    lines.push(`- **Model:** ${conv.modelUsed}`);
    lines.push(`- **Last Activity:** ${new Date(conv.lastMessageAt).toLocaleString()}`);
    if (conv.summary) {
      lines.push(`- **Summary:** ${conv.summary}`);
    }
    lines.push('');
  }

  downloadMarkdownFile(`knownook_workspace_export_${Date.now()}.md`, lines.join('\n'));
}

export type SortMode = 'lastUpdated' | 'dateCreated' | 'alphabetical' | 'mostMessages' | 'recentlyOpened';

/**
 * Sort list of conversations based on active sort mode.
 */
export function sortConversations(conversations: AiConversation[], sortMode: SortMode): AiConversation[] {
  const sorted = [...conversations];

  switch (sortMode) {
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'dateCreated':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'mostMessages':
      return sorted.sort((a, b) => (b.totalMessages || 0) - (a.totalMessages || 0));
    case 'recentlyOpened':
    case 'lastUpdated':
    default:
      return sorted.sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());
  }
}

