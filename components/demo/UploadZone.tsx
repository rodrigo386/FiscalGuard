"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  disabled?: boolean;
  uploading?: boolean;
  onFile: (file: File) => void;
}

export function UploadZone({ disabled, uploading, onFile }: UploadZoneProps) {
  const handleDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      onFile(file);
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
    disabled: disabled || uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-white/70 p-5 text-center transition-colors",
        "cursor-pointer hover:border-brand-teal hover:bg-brand-teal-light",
        isDragActive && "border-brand-teal bg-brand-teal-light",
        (disabled || uploading) && "cursor-not-allowed opacity-60"
      )}
      role="button"
      tabIndex={0}
      aria-label="Área para enviar nota fiscal em XML ou PDF"
    >
      <input {...getInputProps()} />
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal-light text-brand-teal">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FileUp className="h-4 w-4" aria-hidden />
        )}
      </span>
      <div className="text-sm font-medium text-neutral-ink">
        {uploading
          ? "Enviando para o agente..."
          : "Ou arraste uma NFSe, CTe ou NFe real para processar"}
      </div>
      <div className="text-xs text-neutral-muted">
        Aceita XML e PDF · até 10 MB · processado pelo Claude Sonnet
      </div>
    </div>
  );
}
