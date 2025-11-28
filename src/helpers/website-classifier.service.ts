import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { OrganizationDTO } from './dto/organization.dto';
import { RawDataDTO } from './dto/rawdata.dto';
import { StructuredResponseDTO } from './dto/structured-response.dto';
import { StructuredSummaryDTO } from './dto/structured-summary.dto';
import { websiteClassifierPrompt } from './prompts/website-classifier';

@Injectable()
export class WebsiteClassifierService {
  private readonly logger = new Logger(WebsiteClassifierService.name);
  private openai: OpenAI;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  private cleanAndStructureResponse(
    summary: string,
    rawData: RawDataDTO,
  ): StructuredResponseDTO {
    const q1Match = summary.match(/1\.\s?\*\*?.*?\*\*?\s*-?\s*(.+?)\n2\./s);
    const q2Match = summary.match(/2\.\s?\*\*?.*?\*\*?\s*-?\s*(.+?)\n3\./s);
    const q3Match = summary.match(/3\.\s?\*\*?.*?\*\*?\s*-?\s*(.+)/s);

    const structuredSummary: StructuredSummaryDTO = {
      productOrService: q1Match?.[1]?.trim() || null,
      businessCategory: q2Match?.[1]?.trim() || null,
      targetAudience: q3Match?.[1]?.trim() || null,
    };

    const cleanedRawData: RawDataDTO = {
      ...rawData,
      title: rawData.title.trim(),
      h1: rawData.h1.trim(),
      metaDescription: rawData.metaDescription.trim(),
      products: rawData.products,
      organization: rawData.organization.map(
        (org): OrganizationDTO => ({
          ...org,
          name: org.name?.trim(),
          description: org.description?.trim(),
        }),
      ),
    };

    return {
      summary: structuredSummary,
      rawData: cleanedRawData,
      rawText: summary,
    };
  }

  private async extractWebsiteData(url: string) {
    try {
      const { data: html } = await firstValueFrom(this.httpService.get(url));
      const $ = cheerio.load(html);

      const metaDescription =
        $('meta[name="description"]').attr('content') || '';
      const title = $('title').text();
      const h1 = $('h1').first().text();

      const ldJsonScripts = $('script[type="application/ld+json"]');
      let schemaData: any[] = [];

      ldJsonScripts.each((_, el) => {
        try {
          const json = JSON.parse($(el).html() || '');
          schemaData.push(...(Array.isArray(json) ? json : [json]));
        } catch {}
      });

      const products = schemaData
        .filter((s) => s['@type'] === 'Product')
        .map((p) => ({
          name: p.name,
          category: p.category,
          brand: typeof p.brand === 'object' ? p.brand?.name : p.brand,
          description: p.description,
        }));

      const organization = schemaData
        .filter((s) => ['Organization', 'LocalBusiness'].includes(s['@type']))
        .map((o) => ({
          name: o.name,
          url: o.url,
          description: o.description,
          category: o['@type'],
        }));

      return { title, h1, metaDescription, products, organization };
    } catch (err) {
      this.logger.error('Error parsing website:', err.message);
      return { title: "NA", h1: "NA", metaDescription: "NA", products: [], organization: [] };
    }
  }

  async analyzeWebsite(url: string): Promise<StructuredResponseDTO> {
    const rawData = await this.extractWebsiteData(url);
    if (!rawData) {
      throw new ServiceUnavailableException('Could not extract site info');
    }

    const prompt = websiteClassifierPrompt(rawData);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant who classifies businesses from their website.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const summary =
      completion.choices[0]?.message?.content || 'No response from model.';
    return this.cleanAndStructureResponse(summary, rawData);
  }
}
