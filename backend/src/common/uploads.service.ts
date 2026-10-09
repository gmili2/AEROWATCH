import { Global, HttpStatus, Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { AppError } from './http';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOADS_URL = '/uploads';

/** Formats acceptés, reconnus par leur signature binaire (le type annoncé par le navigateur n'est pas fiable). */
function detect(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/**
 * Stockage local des images (dossier UPLOAD_DIR, servi sous /uploads).
 * À remplacer par Cloudinary/S3 pour un hébergement à plusieurs serveurs.
 */
@Injectable()
export class UploadsService {
  private logger = new Logger('Uploads');
  readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get<string>('UPLOAD_DIR') ?? 'uploads');
  }

  async saveImage(file: Express.Multer.File | undefined, folder: 'products' | 'categories') {
    if (!file?.buffer?.length) throw new AppError(HttpStatus.BAD_REQUEST, 'FILE_REQUIRED', 'Aucune image reçue');
    if (file.size > MAX_UPLOAD_BYTES) throw new AppError(HttpStatus.PAYLOAD_TOO_LARGE, 'FILE_TOO_LARGE', 'Image trop lourde (5 Mo maximum)');
    const ext = detect(file.buffer);
    if (!ext) throw new AppError(HttpStatus.BAD_REQUEST, 'FILE_TYPE', 'Format accepté : JPG, PNG ou WebP');
    const name = `${randomUUID()}.${ext}`;
    await mkdir(join(this.root, folder), { recursive: true });
    await writeFile(join(this.root, folder, name), file.buffer, { flag: 'wx' });
    return { key: `${folder}/${name}`, url: `${UPLOADS_URL}/${folder}/${name}` };
  }

  /** Supprime un fichier envoyé ici ; ignore les autres adresses (photos du site, futurs fichiers Cloudinary). */
  async removeByUrl(url: string | null | undefined) {
    if (!url?.startsWith(UPLOADS_URL + '/')) return;
    const path = resolve(this.root, url.slice(UPLOADS_URL.length + 1));
    if (!path.startsWith(this.root + '/')) return;
    await unlink(path).catch((e: NodeJS.ErrnoException) => { if (e.code !== 'ENOENT') this.logger.warn(`Suppression impossible : ${path}`); });
  }
}

@Global()
@Module({ providers: [UploadsService], exports: [UploadsService] })
export class UploadsModule {}
