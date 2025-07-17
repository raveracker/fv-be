import { Injectable, Logger } from '@nestjs/common';
import { OrganicResultDto } from './dto/serper-response.dto';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { SecurityReportDto } from './dto/security-report.dto';
import {
  securityAnalysisFunction,
  securityReportUserContent,
} from './prompts/security-report';

@Injectable()
export class SecurityReportService {
  private readonly logger = new Logger(SecurityReportService.name);
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  private formatDomainInformation(domainInfo: OrganicResultDto[]): string {
    return domainInfo
      .map(
        (result) =>
          `Title: ${result.title}\nLink: ${result.link}\nSnippet: ${result.snippet}\nDate: ${result.date}\n`,
      )
      .join('\n');
  }

  async generateSecurityReport(
    domain: string,
    domainInfo: OrganicResultDto[],
  ): Promise<SecurityReportDto | null> {
    try {
      const formattedDomainInfo = this.formatDomainInformation(domainInfo);
      const userContent = securityReportUserContent(
        domain,
        formattedDomainInfo,
      );
      const resp = await this.openai.chat.completions.create({
        model: 'o4-mini',
        messages: [
          { role: 'system', content: 'You are a cybersecurity analyst.' },
          { role: 'user', content: userContent },
        ],
        functions: [securityAnalysisFunction],
        function_call: { name: securityAnalysisFunction.name },
      });

      const choice = resp.choices?.[0];
      const call = choice?.message?.function_call;
      if (call?.arguments) {
        const report = JSON.parse(call.arguments) as SecurityReportDto;
        return report;
      }

      this.logger.warn('No function_call in OpenAI response');
      return null;
    } catch (err) {
      this.logger.error('Error generating security report', err as any);
      return null;
    }
  }
}
