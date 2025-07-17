import { ApiProperty } from '@nestjs/swagger';

export class OrganizationDTO {
  @ApiProperty({
    example: 'Athflex',
    description:
      'Name of the organization or business extracted from the website schema.',
    required: false,
  })
  name?: string;

  @ApiProperty({
    example: 'https://athflex.com',
    description: 'Official website URL of the organization.',
    required: false,
  })
  url?: string;

  @ApiProperty({
    example: 'Premium gymwear brand in India offering tank tops, joggers, etc.',
    description: 'Short description of the business or brand.',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'Organization',
    description:
      'The schema category of the business (e.g., Organization, LocalBusiness).',
    required: false,
  })
  category?: string;
}
