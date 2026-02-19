/**
 * blob-store.ts
 * Utilitaire de stockage persistant via Vercel Blob.
 * Sur Vercel : lecture/écriture dans le Blob Store (persistant entre instances).
 * En local (dev/MSI) : lecture/écriture dans le filesystem local.
 */
import { promises as fs } from 'fs';
import path from 'path';

const isVercel = process.env.VERCEL === '1';

export async function blobRead(blobPath: string, localPath: string): Promise<string | null> {
  if (isVercel) {
    try {
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: blobPath });
      const blob = blobs.find((b) => b.pathname === blobPath);
      if (!blob) return null;
      // Fetch le contenu depuis l'URL publique
      const resp = await fetch(blob.url);
      if (!resp.ok) return null;
      return await resp.text();
    } catch (e) {
      console.error('blobRead error', e);
      return null;
    }
  } else {
    try {
      return await fs.readFile(localPath, 'utf8');
    } catch {
      return null;
    }
  }
}

export async function blobWrite(blobPath: string, localPath: string, content: string): Promise<void> {
  if (isVercel) {
    const { put } = await import('@vercel/blob');
    await put(blobPath, content, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
  } else {
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, content, 'utf8');
  }
}
