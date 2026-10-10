import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { IsString, MaxLength } from 'class-validator';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Public } from '../common/decorators';
import { AppError } from '../common/http';

class UnlockDto { @IsString() @MaxLength(100) code: string; }

const digest = (s: string) => createHash('sha256').update(s.trim().toLowerCase()).digest();

/** Réglages publics du site (mode démonstration). */
@Public()
@Controller('site')
export class SiteController {
  constructor(private config: ConfigService) {}

  private get demo() { return this.config.get<boolean>('DEMO_MODE') ?? false; }
  private get code() { return this.config.get<string>('DEMO_ACCESS_CODE') || null; }

  @Get()
  info() {
    return { data: { demo: this.demo, accessCodeRequired: this.demo && !!this.code } };
  }

  /**
   * Vérifie le code d'accès de la démonstration. Simple porte d'entrée de l'interface
   * (le site reste techniquement accessible) : limitée en tentatives.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('unlock') @HttpCode(200)
  unlock(@Body() { code }: UnlockDto) {
    const expected = this.code;
    if (!this.demo || !expected) return { data: { ok: true } };
    if (!timingSafeEqual(digest(code), digest(expected))) throw new AppError(HttpStatus.UNAUTHORIZED, 'BAD_ACCESS_CODE', 'Code d’accès incorrect');
    return { data: { ok: true } };
  }
}
