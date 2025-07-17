import { Logger, Module } from '@nestjs/common';
import { WebsiteService } from './website.service';
import { WebsiteController } from './website.controller';
import { WebsiteClassifierService } from 'src/helpers/website-classifier.service';
import { SecurityReportService } from 'src/helpers/security-report.service';
import { SerperService } from 'src/helpers/serper.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from 'src/model/reviews.schema';
import { Website, WebsiteSchema } from 'src/model/website.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Website.name, schema: WebsiteSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    WebsiteService,
    WebsiteClassifierService,
    SecurityReportService,
    SerperService,
    ConfigService,
    Logger,
  ],
  controllers: [WebsiteController],
  exports: [WebsiteService],
})
export class WebsiteModule {}
