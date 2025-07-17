import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { firstValueFrom } from 'rxjs';
import { OrganicResultDto, SerperResponseDto } from './dto/serper-response.dto';

@Injectable()
export class SerperService {
  private readonly logger = new Logger(SerperService.name);
  private readonly serpApiKey: string | undefined;
  private readonly serpBaseUrl = 'https://google.serper.dev/search';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.serpApiKey = this.configService.get<string>('SERPER_API_KEY');
  }

  private async fetchResults(
    domain: string,
    customParams?: Record<string, string>,
  ): Promise<OrganicResultDto[]> {
    const params = { location: 'India', gl: 'in', num: 20, ...customParams };
    const headers = {
      'X-API-KEY': this.serpApiKey,
      'Content-Type': 'application/json',
    };

    const queries = [
      `is ${domain} a scam?`,
      `is ${domain} a scam reddit`,
      `is ${domain} a scam twitter`,
    ];

    try {
      const responses = await Promise.all(
        queries.map((q) =>
          firstValueFrom(
            this.httpService.post(
              this.serpBaseUrl,
              { q, ...params },
              { headers },
            ),
          ),
        ),
      );

      const reviews = responses.flatMap((response) => response.data.organic);

      return reviews;
    } catch (error) {
      this.logger.error(`Failed to fetch SERP for ${domain}`, error);
      throw error;
    }
  }

  async searchAllData(domain: string): Promise<OrganicResultDto[]> {
    return this.fetchResults(domain);
  }

  async searchRecentMonth(domain: string): Promise<OrganicResultDto[]> {
    return this.fetchResults(domain, { tbs: 'qdr:m' });
  }
}
