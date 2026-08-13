import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config/env';

// Subida de las fotos de entrega.
//
// El API de AirCargo NO tiene endpoint de upload: guarda solo la URL. El flujo
// es app → Cloudinary → URL → `PATCH /shipment-assignments/{id}/status`. Por eso
// esto no pasa por `apiClient` (otro host, sin el JWT del backend y con
// `multipart/form-data` en vez de JSON).

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_PHOTO_TYPES = 'image/*';

export const isUploadConfigured = (): boolean =>
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

export const UPLOAD_NOT_CONFIGURED_MESSAGE =
  'La subida de fotos no está configurada. Falta definir NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ' +
  'y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.';

interface CloudinaryUploadResponse {
  secure_url?: string;
  url?: string;
  error?: { message?: string };
}

/**
 * Sube una imagen y devuelve su URL pública. Lanza `Error` con mensaje legible
 * si falta configuración, si el archivo no sirve o si Cloudinary rechaza.
 */
export async function uploadPhoto(file: File): Promise<string> {
  if (!isUploadConfigured()) {
    throw new Error(UPLOAD_NOT_CONFIGURED_MESSAGE);
  }
  if (!file.type.startsWith('image/')) {
    throw new Error(`"${file.name}" no es una imagen.`);
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error(`"${file.name}" pesa más de ${MAX_PHOTO_BYTES / 1024 / 1024} MB.`);
  }

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );

  let data: CloudinaryUploadResponse | null = null;
  try {
    data = (await response.json()) as CloudinaryUploadResponse;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error?.message || `No se pudo subir "${file.name}".`);
  }

  const url = data?.secure_url || data?.url;
  if (!url) {
    throw new Error(`Cloudinary no devolvió la URL de "${file.name}".`);
  }
  return url;
}

/**
 * Sube varias imágenes en paralelo. Si alguna falla, lanza el primer error: el
 * PATCH de la asignación es todo-o-nada, así que no tiene sentido mandar una
 * lista de fotos incompleta.
 */
export async function uploadPhotos(files: File[]): Promise<string[]> {
  return Promise.all(files.map(uploadPhoto));
}
