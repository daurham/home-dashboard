import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HubCard } from '@/components/home/HubCard';
import { useAIStore, type ChatMessage } from '@/lib/store/aiStore';
import { cn } from '@/lib/utils';

export function AITab() {
  const messages = useAIStore((s) => s.messages);
  const isSending = useAIStore((s) => s.isSending);
  const error = useAIStore((s) => s.error);
  const sendMessage = useAIStore((s) => s.sendMessage);
  const clearConversation = useAIStore((s) => s.clearConversation);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft('');
    void sendMessage(text);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col gap-4 md:h-[calc(100dvh-8rem)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Assistant</h2>
          <p className="text-muted-foreground">Talks to household Ollama. This thread is kept on this device.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearConversation}
          disabled={messages.length === 0 && !error && !isSending}
        >
          <Trash2 className="h-4 w-4" />
          Clear context
        </Button>
      </div>

      <HubCard className="h-auto min-h-0 flex-1 p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
            {messages.length === 0 && !isSending ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 opacity-70" />
                <p className="text-sm">Ask anything. Follow-ups stay in this conversation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} pending={isSending && !message.content} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-border/70 p-3 md:p-4">
            {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Message the household assistant…"
                rows={2}
                disabled={isSending}
                className="min-h-[44px] resize-none"
              />
              <Button type="submit" disabled={isSending || !draft.trim()}>
                {isSending ? '…' : 'Send'}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Enter to send · Shift+Enter for a new line · Clear context starts a fresh thread
            </p>
          </form>
        </div>
      </HubCard>
    </div>
  );
}

function ChatBubble({ message, pending }: { message: ChatMessage; pending: boolean }) {
  const fromUser = message.role === 'user';
  return (
    <div className={cn('flex', fromUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed',
          fromUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {message.content || (pending ? 'Thinking…' : '')}
      </div>
    </div>
  );
}
