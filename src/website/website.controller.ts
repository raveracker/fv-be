import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { WebsiteService } from './website.service';
import { AnalyzeWebsiteDto } from './dto/analyze-website.dto';
import { Website } from 'src/model/website.schema';
import { Public } from 'src/auth/decorators/public.decorator';
import { Review } from 'src/model/reviews.schema';

@Controller('website')
export class WebsiteController {
  constructor(private readonly websiteService: WebsiteService) {}

  @Post('analyze')
  analyze(@Body() dto: AnalyzeWebsiteDto): Promise<Website> {
    return this.websiteService.fetchWebsiteData(dto.url);
  }

  @Get(':websiteId')
  async getReviews(
    @Param('websiteId') websiteId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.websiteService.fetchWebsiteReviews(websiteId, page, limit);
  }
}
