import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

interface AIState {
  config: AIConfig;
  updateConfig: (updates: Partial<AIConfig>) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      config: {
        enabled: false,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
      },
      updateConfig: (updates) => set((state) => ({
        config: { ...state.config, ...updates }
      })),
    }),
    {
      name: 'ai-storage',
    }
  )
);

