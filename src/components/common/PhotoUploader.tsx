"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  ACCEPTED_PHOTO_TYPES,
  getPhotoFileError,
  MAX_TASK_PHOTOS,
} from "@/services/driverTaskService";

interface PhotoUploaderProps {
  /** URLs de las fotos YA guardadas en el servidor. */
  value: string[];
  /**
   * Manda los archivos al API y deja el resultado en el estado del padre (la
   * respuesta trae la lista completa). Si falla tiene que lanzar un `Error` con
   * el mensaje ya listo para mostrar: se pinta acá abajo, junto al control.
   */
  onUpload: (files: File[]) => Promise<void>;
  maxPhotos?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

export default function PhotoUploader({
  value,
  onUpload,
  maxPhotos = MAX_TASK_PHOTOS,
  disabled = false,
  label = "Evidencia fotográfica",
  hint,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = maxPhotos - value.length;
  const canAdd = !disabled && !uploading && remaining > 0;

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      // Permite volver a elegir el mismo archivo después de un fallo.
      const clearInput = () => {
        if (inputRef.current) inputRef.current.value = "";
      };
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);
      setError(null);

      if (files.length > remaining) {
        setError(
          remaining === 1
            ? "Solo queda lugar para una foto más."
            : `Solo quedan ${remaining} lugares para fotos.`
        );
        clearInput();
        return;
      }

      // El backend rechaza el lote entero si un archivo no sirve, así que se
      // corta acá antes de gastar la subida.
      const rejected = files.map(getPhotoFileError).find((msg): msg is string => !!msg);
      if (rejected) {
        setError(rejected);
        clearInput();
        return;
      }

      setUploading(true);
      try {
        await onUpload(files);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron subir las fotos.");
      } finally {
        setUploading(false);
        clearInput();
      }
    },
    [onUpload, remaining]
  );

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">{label}</span>
        <span className="text-xs text-gray-400">
          {value.length} de {maxPhotos}
        </span>
      </div>

      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, index) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Evidencia ${index + 1}`} className="h-full w-full object-cover" />
            </a>
          ))}
        </div>
      )}

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
      {!error && value.length > 0 && (
        // No hay endpoint para borrar: una foto subida ya ocupa uno de los tres
        // lugares. Vale decirlo antes de que el conductor busque la crucecita.
        <p className="mt-2 text-xs text-gray-400">
          Las fotos se guardan apenas las subes y no se pueden quitar.
        </p>
      )}
      {!error && value.length === 0 && hint && (
        <p className="mt-2 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}
