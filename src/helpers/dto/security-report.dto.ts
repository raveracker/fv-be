export class SecurityReportDto {
  domain: string;
  isScam: boolean;
  riskFactor: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  domainRating: number;
  summary: string;
}
