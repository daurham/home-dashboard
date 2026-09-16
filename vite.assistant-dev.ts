import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const DEFAULT_OLLAMA_URL = 'http://192.168.1.161:11434/api/generate';
const DEFAULT_MODEL = 'llama3.2-vision:11b';

type HistoryTurn = { role?: string; content?: string };

function buildPrompt(message: string, history: HistoryTurn[] = []) {
  let prompt = 'You are a helpful AI home assistant.\n';
  const prior = history.filter((item) => item?.content?.trim() && (item.role === 'user' || item.role === 'assistant'));
  if (prior.length > 0) {
    prompt += '\nPrevious conversation:\n';
    for (const item of prior.slice(-20)) {
      prompt += `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content!.trim()}\n`;
    }
  }
  prompt += `\nUser: ${message}\nAssistant:`;
  return prompt;
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  return JSON.parse(raw) as {
    message?: string;
    conversation_history?: HistoryTurn[];
    stream?: boolean;
  };
}

/**
 * Laptop Vite talks to household Ollama directly for POST /api/assistant.
 * The home-box node-api does not have this route until it is rebuilt.
 */
export function assistantDevPlugin(options: { ollamaUrl?: string; model?: string } = {}): Plugin {
  const ollamaUrl = options.ollamaUrl || process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL;
  const model = options.model || process.env.ASSISTANT_MODEL || DEFAULT_MODEL;

  return {
    name: 'assistant-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0];
        if (req.method !== 'POST' || path !== '/api/assistant') {
          next();
          return;
        }
        try {
          await handleAssistant(req, res, { ollamaUrl, model });
        } catch (error) {
          if (res.headersSent) {
            if (!res.writableEnded) res.end();
            return;
          }
          const message = error instanceof Error ? error.message : 'Assistant request failed';
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Ollama request failed', details: message }));
        }
      });
    },
  };
}

async function handleAssistant(
  req: IncomingMessage,
  res: ServerResponse,
  { ollamaUrl, model }: { ollamaUrl: string; model: string },
) {
  const body = await readJson(req);
  const text = typeof body.message === 'string' ? body.message.trim() : '';
  if (!text) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'message is required' }));
    return;
  }

  const prompt = buildPrompt(text, body.conversation_history);
  const stream = body.stream !== false;

  const ollamaRes = await fetch(ollamaUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream }),
  });

  if (!ollamaRes.ok) {
    const details = await ollamaRes.text().catch(() => '');
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Ollama request failed', details: details.slice(0, 300) }));
    return;
  }

  if (!stream) {
    const data = (await ollamaRes.json()) as { response?: string };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ reply: data.response || '' }));
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!ollamaRes.body) {
    res.end();
    return;
  }

  const reader = ollamaRes.body.getReader();
  const decoder = new TextDecoder();
  let leftover = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    leftover += decoder.decode(value, { stream: true });
    const lines = leftover.split('\n');
    leftover = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line) as { response?: string; done?: boolean };
        if (data.response) res.write(data.response);
        if (data.done) {
          res.end();
          return;
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  if (!res.writableEnded) res.end();
}
