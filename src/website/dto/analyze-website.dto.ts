import { IsUrl } from 'class-validator';

export class AnalyzeWebsiteDto {
  @IsUrl()
  url: string;
}
