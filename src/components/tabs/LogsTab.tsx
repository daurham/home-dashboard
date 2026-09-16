import { FormEvent, useEffect, useRef, useState } from 'react';
import { CalendarPlus, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HubCard } from '@/components/home/HubCard';
import { FetchSkeleton } from '@/components/ui/fetch-skeleton';
import { useLogStore } from '@/lib/store/logStore';
import { usePreferencesStore } from '@/lib/store';
import { prependDatedBlock, formatLogDateStamp, insertDateAt } from '@/lib/logDocument';
import { cn } from '@/lib/utils';

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';

export function LogsTab() {
  const books = useLogStore((s) => s.books);
  const activeBookId = useLogStore((s) => s.activeBookId);
  const hasLoaded = useLogStore((s) => s.hasLoaded);
  const isLoading = useLogStore((s) => s.isLoading);
  const error = useLogStore((s) => s.error);
  const loadBooks = useLogStore((s) => s.loadBooks);
  const selectBook = useLogStore((s) => s.selectBook);
  const addBook = useLogStore((s) => s.addBook);
  const removeBook = useLogStore((s) => s.removeBook);
  const saveBody = useLogStore((s) => s.saveBody);
  const expenseTimeZone = usePreferencesStore((s) => s.expenseTimeZone);

  const [bookOpen, setBookOpen] = useState(false);
  const [bookName, setBookName] = useState('');
  const [draft, setDraft] = useState('');
  const [addNote, setAddNote] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  const activeBook = books.find((book) => book.id === activeBookId) ?? null;
  const isDirty = saveState === 'dirty' || saveState === 'error';

  useEffect(() => {
    const book = useLogStore.getState().books.find((item) => item.id === activeBookId);
    setDraft(book?.body ?? '');
    setSaveState('saved');
    setAddNote('');
  }, [activeBookId]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const confirmDiscard = () => {
    if (!isDirty) return true;
    return window.confirm('Discard unsaved changes?');
  };

  const editDraft = (next: string) => {
    setDraft(next);
    setSaveState('dirty');
  };

  const save = async () => {
    if (!activeBookId) return;
    setSaveState('saving');
    try {
      await saveBody(activeBookId, draft);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const switchBook = (id: string) => {
    if (id === activeBookId) return;
    if (!confirmDiscard()) return;
    const book = useLogStore.getState().books.find((item) => item.id === id);
    selectBook(id);
    setDraft(book?.body ?? '');
    setSaveState('saved');
    setAddNote('');
  };

  const stamp = () => formatLogDateStamp(expenseTimeZone);

  const insertDate = () => {
    const el = editorRef.current;
    const index = el ? el.selectionStart : draft.length;
    const next = insertDateAt(draft, index, stamp());
    editDraft(next.text);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.caret, next.caret);
    });
  };

  const addToLog = (event?: FormEvent) => {
    event?.preventDefault();
    const next = prependDatedBlock(draft, stamp(), addNote);
    setAddNote('');
    editDraft(next);
    requestAnimationFrame(() => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      el.scrollTop = 0;
      el.setSelectionRange(0, 0);
    });
  };

  const createBook = async (event?: FormEvent) => {
    event?.preventDefault();
    const name = bookName.trim();
    if (!name) return;
    if (!confirmDiscard()) return;
    await addBook(name);
    setBookOpen(false);
    setBookName('');
  };

  const saveLabel =
    saveState === 'saving' ? 'Saving…'
      : saveState === 'dirty' ? 'Unsaved'
        : saveState === 'error' ? 'Save failed'
          : 'Saved';

  return (
    <div className="flex min-h-[70vh] flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Logs</h2>
        <p className="text-muted-foreground">
          Household notes that live here — a shared document per log, not the notes on your phone.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!hasLoaded ? (
          <div className="flex gap-2" role="status" aria-label="Loading logs">
            <div className="h-8 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          </div>
        ) : (
          books.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => switchBook(book.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                book.id === activeBookId
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              {book.name}
            </button>
          ))
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => { setBookName(''); setBookOpen(true); }}>
          <Plus className="h-4 w-4" />
          New log
        </Button>
        {activeBook && books.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              if (window.confirm(`Delete the ${activeBook.name} log?`)) {
                void removeBook(activeBook.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete log
          </Button>
        )}
      </div>

      <HubCard className="flex min-h-0 flex-1 flex-col p-0">
        {error && <p className="px-5 pt-4 text-sm text-destructive">{error}</p>}
        {!hasLoaded || (isLoading && !activeBook) ? (
          <div className="p-5">
            <FetchSkeleton lines={8} lineClassName="h-6 rounded-md" />
          </div>
        ) : !activeBook ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Create a log to start writing.</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2">
              <p className="truncate text-sm font-medium">{activeBook.name}.txt</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs tabular-nums',
                  saveState === 'error' ? 'text-destructive' : 'text-muted-foreground',
                )}>
                  {saveLabel}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={insertDate}>
                  <CalendarPlus className="h-4 w-4" />
                  Insert date
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void save()}
                  disabled={saveState === 'saving' || saveState === 'saved'}
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
            <Textarea
              ref={editorRef}
              value={draft}
              onChange={(event) => editDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 's' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void save();
                }
              }}
              placeholder={`Type a few words or a whole journal entry.\nUse Insert date or Add below to stamp ${stamp()}.`}
              className="min-h-[22rem] flex-1 resize-none overflow-y-auto rounded-none border-0 bg-transparent px-4 py-3 font-mono text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <form
              onSubmit={addToLog}
              className="flex items-end gap-2 border-t border-border/70 p-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor="log-add" className="text-xs text-muted-foreground">
                  Add to {activeBook.name}
                </Label>
                <Textarea
                  id="log-add"
                  rows={2}
                  value={addNote}
                  onChange={(event) => setAddNote(event.target.value)}
                  placeholder="A few words, or a longer entry — this adds it at the top with today’s date. Save when you’re done."
                  className="resize-none"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      addToLog();
                    }
                  }}
                />
              </div>
              <Button type="submit">Add</Button>
            </form>
          </>
        )}
      </HubCard>

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent>
          <form onSubmit={(event) => void createBook(event)}>
            <DialogHeader>
              <DialogTitle>New log</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-3">
              <Label htmlFor="log-book-name">Name</Label>
              <Input
                id="log-book-name"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="Vehicles, Pets, Warranty…"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setBookOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!bookName.trim()}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
