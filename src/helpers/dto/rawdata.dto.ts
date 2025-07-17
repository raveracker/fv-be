import { ApiProperty } from '@nestjs/swagger';
import { OrganizationDTO } from './organization.dto';

export class RawDataDTO {
  @ApiProperty({
    example: 'Athflex | Premium Gym-wear Tailored for Indian Bodies',
    description: 'The <title> tag content of the homepage.',
  })
  title: string;

  @ApiProperty({
    example: 'Athflex',
    description: 'The first <h1> element text found on the homepage.',
  })
  h1: string;

  @ApiProperty({
    example:
      'Shop Athflex – India’s #1 Premium Gymwear for Fitness Enthusiasts! Tailored for Indian skin & body types.',
    description: 'The meta description of the website, useful for SEO context.',
  })
  metaDescription: string;

  @ApiProperty({
    type: [Object],
    example: [],
    description:
      'List of structured product schema entries extracted from the page.',
  })
  products: any[];

  @ApiProperty({
    type: [OrganizationDTO],
    description: 'List of organization schema entries extracted from the page.',
  })
  organization: OrganizationDTO[];
}
