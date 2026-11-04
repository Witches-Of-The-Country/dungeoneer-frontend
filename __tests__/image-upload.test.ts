import { describe, it, expect } from 'vitest';
import { processAvatarImage } from '@/lib/image-upload';

describe('processAvatarImage Utility', () => {
  it('rejects null or missing file', async () => {
    await expect(processAvatarImage(null as any)).rejects.toThrow('Nenhum arquivo fornecido');
  });

  it('rejects unsupported file formats like SVG to prevent stored XSS', async () => {
    const svgFile = new File(['<svg></svg>'], 'avatar.svg', { type: 'image/svg+xml' });
    await expect(processAvatarImage(svgFile)).rejects.toThrow('Arquivos SVG são proibidos');
  });

  it('rejects non-image formats like HTML or JS', async () => {
    const htmlFile = new File(['<script>alert(1)</script>'], 'payload.html', { type: 'text/html' });
    await expect(processAvatarImage(htmlFile)).rejects.toThrow('Formato de imagem não suportado');
  });

  it('processes valid PNG / JPEG / WebP files successfully', async () => {
    const validFile = new File(['dummy-image-bytes'], 'avatar.png', { type: 'image/png' });
    const result = await processAvatarImage(validFile);
    expect(result).toBeDefined();
    expect(result.startsWith('data:image/')).toBe(true);
  });
});
