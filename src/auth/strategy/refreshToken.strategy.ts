import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private config: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(req: Request, payload: any) {
    const authHeader = req.get('Authorization') || '';
    const refreshToken = authHeader.replace(/^Bearer\s+/, '');

    if (!payload.jti) {
      throw new UnauthorizedException('Malformed refresh token');
    }
    const isRevoked = await this.cacheManager.get(`blacklist:${payload.jti}`);
    if (isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    return { ...payload, refreshToken };
  }
}
