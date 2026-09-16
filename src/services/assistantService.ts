const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export type AssistantRole = 'user' | 'assistant';

export interface AssistantTurn {
  role: AssistantRole;
  content: string;
}

export async function streamHomeAssistant(
  message: string,
  conversationHistory: AssistantTurn[],
  onToken: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: `API ${response.status} ${response.statusText || ''}`.trim(),
    }));
    throw new Error(error.error || error.details || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = (await response.json()) as { reply?: string; result?: string };
    const reply = data.reply || data.result || '';
    if (reply) onToken(reply);
    return reply;
  }

  if (!response.body) {
    throw new Error('Assistant stream had no body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let reply = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (!chunk) continue;
    reply += chunk;
    onToken(chunk);
  }

  return reply;
}
