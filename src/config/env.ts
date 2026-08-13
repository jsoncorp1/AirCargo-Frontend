export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7099/api/v1/core';

// Subida de las fotos de entrega. El API no tiene endpoint de upload: la app
// sube la imagen directo a Cloudinary y le manda al backend solo la URL.
//
// Hace falta un upload preset UNSIGNED (Settings → Upload → Upload presets),
// porque el navegador no puede firmar sin exponer el api_secret. Sin estas dos
// variables la pantalla de entrega avisa y no deja marcar "Entregado".
export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
