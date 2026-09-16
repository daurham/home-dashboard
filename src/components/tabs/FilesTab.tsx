import { useEffect, useRef, useState } from 'react';
import { Copy, Download, FileText, FolderUp, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HubCard } from '@/components/home/HubCard';
import { FetchSkeleton } from '@/components/ui/fetch-skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { filesApi, type SharedFile } from '@/services/apiService';
import {
  canUploadFile,
  copySharedFile,
  formatBytes,
  isPreviewableImage,
  useFileShareStore,
} from '@/lib/store/fileShareStore';
import { cn } from '@/lib/utils';

function FileThumb({
  file,
  className,
}: {
  file: SharedFile;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const previewable = isPreviewableImage(file) && !failed;

  if (!previewable) {
    return (
      <span
        className={cn(
          'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted text-muted-foreground',
          className,
        )}
        aria-hidden
      >
        <FileText className="h-5 w-5" />
      </span>
    );
  }

  return (
    <img
      src={filesApi.downloadUrl(file.id)}
      alt=""
      className={cn('h-12 w-12 shrink-0 rounded-lg border border-border/70 object-cover bg-muted', className)}
      onError={() => setFailed(true)}
    />
  );
}

export function FilesTab() {
  const files = useFileShareStore((s) => s.files);
  const usedBytes = useFileShareStore((s) => s.usedBytes);
  const quotaBytes = useFileShareStore((s) => s.quotaBytes);
  const remainingBytes = useFileShareStore((s) => s.remainingBytes);
  const hasLoaded = useFileShareStore((s) => s.hasLoaded);
  const isUploading = useFileShareStore((s) => s.isUploading);
  const error = useFileShareStore((s) => s.error);
  const load = useFileShareStore((s) => s.load);
  const upload = useFileShareStore((s) => s.upload);
  const remove = useFileShareStore((s) => s.remove);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SharedFile | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const usedPercent = quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0;
  const banner = localError || error;

  const pickFiles = async (list: FileList | File[] | null) => {
    if (!list || isUploading) return;
    setLocalError(null);
    for (const file of Array.from(list)) {
      const blocked = canUploadFile(file, useFileShareStore.getState().remainingBytes);
      if (blocked) {
        setLocalError(blocked);
        return;
      }
      await upload(file);
    }
  };

  const copyFile = async (file: SharedFile) => {
    if (copyingId) return;
    setCopyingId(file.id);
    try {
      const kind = await copySharedFile(file);
      toast.success(kind === 'text' ? 'Copied text' : kind === 'image' ? 'Copied image' : 'Copied link');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not copy');
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">File share</h2>
          <p className="text-muted-foreground">Upload from any device, download from any other. Delete files to free space.</p>
        </div>
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading || remainingBytes <= 0}>
          <Upload className="h-4 w-4" />
          {isUploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            void pickFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      <HubCard className="p-5">
        <div className="mb-4 space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium">Storage</span>
            <span className="tabular-nums text-muted-foreground">
              {formatBytes(usedBytes)} used · {formatBytes(remainingBytes)} free of {formatBytes(quotaBytes)}
            </span>
          </div>
          <Progress value={usedPercent} className="h-2" />
        </div>

        <div
          className={cn(
            'mb-4 rounded-xl border border-dashed px-4 py-6 text-center text-sm transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-border text-muted-foreground',
            (isUploading || remainingBytes <= 0) && 'opacity-60',
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            void pickFiles(event.dataTransfer.files);
          }}
        >
          Drop a file here, or use Upload. Any type is allowed if it fits in remaining space.
        </div>

        {banner && <p className="mb-3 text-sm text-destructive">{banner}</p>}

        {!hasLoaded ? (
          <FetchSkeleton lines={4} lineClassName="h-12 rounded-xl" />
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <FolderUp className="h-8 w-8 opacity-70" />
            <p className="text-sm">Nothing shared yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {files.map((file) => {
              const canPreview = isPreviewableImage(file);
              return (
                <li key={file.id} className="flex items-center gap-3 py-2.5">
                  {canPreview ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setPreview(file)}
                      aria-label={`Preview ${file.originalName}`}
                    >
                      <FileThumb file={file} />
                    </button>
                  ) : (
                    <FileThumb file={file} />
                  )}
                  <div className="min-w-0 flex-1">
                    {canPreview ? (
                      <button
                        type="button"
                        className="block max-w-full truncate text-left font-medium hover:underline"
                        onClick={() => setPreview(file)}
                      >
                        {file.originalName}
                      </button>
                    ) : (
                      <p className="truncate font-medium">{file.originalName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.sizeBytes)}
                      {file.createdAt ? ` · ${new Date(file.createdAt).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-md px-3 text-sm font-medium hover:bg-accent disabled:opacity-50"
                    onClick={() => void copyFile(file)}
                    disabled={copyingId === file.id}
                  >
                    <Copy className="h-4 w-4" />
                    {copyingId === file.id ? 'Copying…' : 'Copy'}
                  </button>
                  <a
                    href={filesApi.downloadUrl(file.id)}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-md px-3 text-sm font-medium hover:bg-accent"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${file.originalName}`}
                    onClick={() => {
                      if (window.confirm(`Delete ${file.originalName}? This frees ${formatBytes(file.sizeBytes)}.`)) {
                        void remove(file.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </HubCard>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{preview?.originalName ?? 'Preview'}</DialogTitle>
            <DialogDescription>
              {preview ? `${formatBytes(preview.sizeBytes)}${preview.createdAt ? ` · ${new Date(preview.createdAt).toLocaleString()}` : ''}` : 'Shared file preview'}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded-xl bg-muted">
                <img
                  src={filesApi.downloadUrl(preview.id)}
                  alt={preview.originalName}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => void copyFile(preview)} disabled={copyingId === preview.id}>
                  <Copy className="h-4 w-4" />
                  {copyingId === preview.id ? 'Copying…' : 'Copy'}
                </Button>
                <Button asChild>
                  <a href={filesApi.downloadUrl(preview.id)} download={preview.originalName}>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
