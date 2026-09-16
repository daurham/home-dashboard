import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { streamHomeAssistant, type AssistantTurn } from '@/services/assistantService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface AIState {
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearConversation: () => void;
}

const HISTORY_LIMIT = 20;

let activeAbort: AbortController | null = null;

function newId(): string {
  return crypto.randomUUID();
}

function toHistory(messages: ChatMessage[]): AssistantTurn[] {
  return messages
    .filter((msg) => msg.content.trim())
    .slice(-HISTORY_LIMIT)
    .map((msg) => ({ role: msg.role, content: msg.content }));
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [],
      isSending: false,
      error: null,

      sendMessage: async (text) => {
        const content = text.trim();
        if (!content || get().isSending) return;

        const userMessage: ChatMessage = {
          id: newId(),
          role: 'user',
          content,
          createdAt: new Date().toISOString(),
        };
        const assistantId = newId();
        const history = toHistory(get().messages);
        activeAbort?.abort();
        const abort = new AbortController();
        activeAbort = abort;

        set({
          isSending: true,
          error: null,
          messages: [
            ...get().messages,
            userMessage,
            {
              id: assistantId,
              role: 'assistant',
              content: '',
              createdAt: new Date().toISOString(),
            },
          ],
        });

        try {
          await streamHomeAssistant(
            content,
            history,
            (chunk) => {
              set({
                messages: get().messages.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: msg.content + chunk } : msg,
                ),
              });
            },
            abort.signal,
          );
          if (abort.signal.aborted) return;
          const latest = get().messages.find((msg) => msg.id === assistantId);
          if (latest && !latest.content.trim()) {
            set({
              messages: get().messages.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: '(No reply from Ollama.)' }
                  : msg,
              ),
            });
          }
        } catch (error) {
          if (abort.signal.aborted || (error instanceof Error && error.name === 'AbortError')) return;
          const message = error instanceof Error ? error.message : 'Assistant request failed';
          set({
            error: message,
            messages: get().messages.filter((msg) => msg.id !== assistantId),
          });
        } finally {
          if (activeAbort === abort) {
            activeAbort = null;
            set({ isSending: false });
          }
        }
      },

      clearConversation: () => {
        activeAbort?.abort();
        activeAbort = null;
        set({ messages: [], error: null, isSending: false });
      },
    }),
    {
      name: 'ai-storage',
      partialize: (state) => ({ messages: state.messages }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { messages?: ChatMessage[] } | undefined;
        return {
          ...currentState,
          messages: Array.isArray(persisted?.messages) ? persisted.messages : currentState.messages,
        };
      },
    },
  ),
);
