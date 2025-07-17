import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGlobalAuthGuard } from './auth/guards/globalAuth.guard';
import { UserModule } from './user/user.module';
import { WebsiteModule } from './website/website.module';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(process.cwd(), '../.env'), '.env'],
      isGlobal: true,
      cache: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        stores: [createKeyv(config.get<string>('REDIS_URL'))],
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRoot(
      process.env.DB_URI ?? 'mongodb://localhost:27017/fraudvisordb',
    ),
    AuthModule,
    UserModule,
    WebsiteModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGlobalAuthGuard,
    },
  ],
})
export class AppModule {}
