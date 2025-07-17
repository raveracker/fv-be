// apps/server/src/user/user.module.ts
import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { User, UserSchema } from './../model/user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenStrategy } from 'src/auth/strategy/refreshToken.strategy';
import { AccessTokenStrategy } from 'src/auth/strategy/token.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    UserService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    ConfigService,
    Logger,
  ],
  controllers: [UserController],
})
export class UserModule {}
