import { Expose, Exclude, Type } from 'class-transformer';

export class SitelinkDto {
  title: string;
  link: string;
}

export class OrganicResultDto {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  rating?: number;
  ratingCount?: number;
  position: number;

  @Type(() => SitelinkDto)
  sitelinks?: SitelinkDto[];
}

@Exclude()
export class SerperResponseDto {
  @Expose({ name: 'organic' })
  @Type(() => OrganicResultDto)
  reviews: OrganicResultDto[];
}
