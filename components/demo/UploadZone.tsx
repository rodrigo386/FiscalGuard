"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, FileUp, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  label: string;
  hint: string;
  file: File | null;
  disabled?: boolean;
  uploading?: boolean;
  optional?: boolean;
  onFile: (file: File) => void;
  onClear?: () => void;
}

export function UploadZone({
  label,
  hint,
  file,
  disabled,
  uploading,
  optional,
  onFile,
  onClear,
}: UploadZoneProps) {
  const handleDrop = useCallback(
    (accepted: File[]) => {
      const picked = accepted[0];
      if (!picked) return;
      onFile(picked);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "application/xml": [".xml"],
      "text/xml": [".xml"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: disabled || uploading || !!file,
  });

  if (file) {
    return (
      <div className="flex h-full flex-col gap-2 rounded-lg border border-brand-teal/40 bg-brand-teal-light/40 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-brand-teal" aria-hidden />
            <span className="truncate text-xs font-semibold text-neutral-ink">
              {label}
            </span>
          </div>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              aria-label={`Remover ${label}`}
              className="rounded-md p-0.5 text-neutral-muted transition-colors hover:bg-white hover:text-status-error disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 rounded-md bg-white px-2 py-2">
          <div className="truncate text-[11px] font-mono text-neutral-ink/80">
            {file.name}
          </div>
          <div className="mt-1 text-[10px] text-neutral-muted">
            {(file.size / 1024).toFixed(1)} KB · {file.type || "arquivo"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex h-full min-h-[128px] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed bg-white/70 p-3 text-center transition-colors",
        "cursor-pointer hover:border-brand-teal hover:bg-brand-teal-light",
        isDragActive && "border-brand-teal bg-brand-teal-light",
        (disabled || uploading) && "cursor-not-allowed opacity-60"
      )}
      role="button"
      tabIndex={0}
      aria-label={`Área para enviar ${label.toLowerCase()}`}
    >
      <input {...getInputProps()} />
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal-light text-brand-teal">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FileUp className="h-4 w-4" aria-hidden />
        )}
      </span>
      <div className="flex items-center gap-1.5">
        <div className="text-xs font-semibold text-neutral-ink">{label}</div>
        {optional ? (
          <span className="rounded-full bg-neutral-bg px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-neutral-muted">
            Opcional
          </span>
        ) : null}
      </div>
      <div className="text-[11px] leading-snug text-neutral-muted">{hint}</div>
    </div>
  );
}
