"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  ACCEPTED_PHOTO_TYPES,
  isUploadConfigured,
  uploadPhotos,
  UPLOAD_NOT_CONFIGURED_MESSAGE,
} from "@/services/uploadService";

interface PhotoUploaderProps {
  // URLs ya subidas. El componente es controlado: sube el archivo, y en cuanto
  // tiene la URL se la pasa al padre, que es quien la manda en el PATCH.
  value: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

const DEFAULT_MAX_PHOTOS = 4;

export default function PhotoUploader({
  value,
  onChange,
  maxPhotos = DEFAULT_MAX_PHOTOS,
  disabled = false,
  label = "Evidencia fotográfica",
  hint,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isUploadConfigured();
  const remaining = maxPhotos - value.length;
  const canAdd = !disabled && !uploading && configured && remaining > 0;

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList).slice(0, remaining);
      setError(null);
      setUploading(true);
      try {
        const urls = await uploadPhotos(files);
        onChange([...value, ...urls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron subir las fotos.");
      } finally {
        setUploading(false);
        // Permite volver a elegir el mismo archivo después de un fallo.
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onChange, remaining, value]
  );

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">{label}</span>
        <span className="text-xs text-gray-400">
          {value.length}/{maxPhotos}
        </span>
      </div>

      {!configured && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-400">
          {UPLOAD_NOT_CONFIGURED_MESSAGE}
        </div>
      )}

      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Evidencia ${index + 1}`} className="h-full w-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Quitar foto ${index + 1}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {configured && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!canAdd}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-5 text-center transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium text-gray-500">
            {uploading
              ? "Subiendo…"
              : remaining <= 0
              ? "Llegaste al máximo de fotos"
              : "Tomar o elegir foto"}
          </span>
        </button>
      )}

      {/* `capture="environment"` abre la cámara trasera directo en el celular. */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_PHOTO_TYPES}
        capture="environment"
        multiple={maxPhotos > 1}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-xs text-error-500">{error}</p>}
      {hint && !error && <p className="mt-2 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
