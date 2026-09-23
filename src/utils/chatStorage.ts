/**
 * chatStorage: A dedicated LocalStorage wrapper to persist the last 5 chat messages
 * in ChatWidget / AssistantPanel, ensuring users retain conversation context on page refresh.
 */

export interface StoredChatMsg {
  role: 'user' | 'model';
  content: string;
}

const CHAT_STORAGE_KEY = 'nd_chat_recent_messages_v1';
const MAX_MESSAGES = 5;

export const chatStorage = {
  /**
   * Retrieves the last saved messages from localStorage.
   * Returns empty array if none found or in case of parsing errors.
   */
  loadMessages: (): StoredChatMsg[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // Enforce max 5 items
        return parsed.slice(-MAX_MESSAGES).filter(
          (m): m is StoredChatMsg =>
            m &&
            typeof m.content === 'string' &&
            (m.role === 'user' || m.role === 'model')
        );
      }
      return [];
    } catch (err) {
      console.warn('Failed to load chat history from localStorage', err);
      return [];
    }
  },

  /**
   * Saves the list of messages, strictly persisting only the last 5.
   */
  saveMessages: (messages: StoredChatMsg[]): void => {
    if (typeof window === 'undefined') return;
    try {
      const last5 = messages.slice(-MAX_MESSAGES);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(last5));
    } catch (err) {
      console.warn('Failed to save chat history to localStorage', err);
    }
  },

  /**
   * Clears the saved chat messages from localStorage.
   */
  clearMessages: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
