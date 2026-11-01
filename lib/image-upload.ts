/**
 * Utility for client-side avatar image compression and XSS prevention.
 * Strictly whitelists PNG, JPEG, and WebP.
 * Strictly rejects SVG, HTML, and script payloads to eliminate stored XSS.
 */

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_DATA_URL_LENGTH = 700_000; // ~512 KB
const TARGET_SIZE = 256;

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function processAvatarImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Nenhum arquivo fornecido.'));
    }

    const mime = file.type?.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime)) {
      return reject(
        new Error(
          'Formato de imagem não suportado. Por favor, use PNG, JPEG ou WebP. Arquivos SVG são proibidos.'
        )
      );
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo de imagem.'));
    };

    reader.onload = () => {
      const rawDataUrl = reader.result as string;

      // Defensive check against SVG injection in data URL
      const lower = rawDataUrl.toLowerCase();
      if (
        lower.includes('image/svg') ||
        lower.includes('<svg') ||
        lower.includes('<script') ||
        lower.includes('javascript:')
      ) {
        return reject(
          new Error('Conteúdo de imagem inválido. SVGs e scripts são estritamente proibidos.')
        );
      }

      // If document or canvas 2D context is unavailable (headless jsdom / test env), return data URL
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        if (rawDataUrl.length > MAX_DATA_URL_LENGTH) {
          return reject(new Error('A imagem é muito grande. Tamanho máximo excedido.'));
        }
        return resolve(rawDataUrl);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext ? canvas.getContext('2d') : null;
      if (!ctx) {
        if (rawDataUrl.length > MAX_DATA_URL_LENGTH) {
          return reject(new Error('A imagem é muito grande. Tamanho máximo excedido.'));
        }
        return resolve(rawDataUrl);
      }

      const img = new Image();
      img.onload = () => {
        try {
          const targetW = options.maxWidth ?? TARGET_SIZE;
          const targetH = options.maxHeight ?? TARGET_SIZE;

          // Scale and maintain center crop aspect ratio
          let srcX = 0;
          let srcY = 0;
          let srcW = img.width;
          let srcH = img.height;

          if (img.width > img.height) {
            srcW = img.height;
            srcX = (img.width - img.height) / 2;
          } else if (img.height > img.width) {
            srcH = img.width;
            srcY = (img.height - img.width) / 2;
          }

          canvas.width = targetW;
          canvas.height = targetH;

          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

          // Export as webp or jpeg
          const quality = options.quality ?? 0.82;
          const compressed = canvas.toDataURL('image/webp', quality);

          if (compressed.length > MAX_DATA_URL_LENGTH) {
            return reject(new Error('A imagem comprimida ainda excede o limite máximo permitido.'));
          }

          resolve(compressed);
        } catch (err: any) {
          reject(new Error(err?.message || 'Falha ao processar imagem no canvas.'));
        }
      };

      img.onerror = () => {
        reject(new Error('Falha ao decodificar dados da imagem.'));
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
