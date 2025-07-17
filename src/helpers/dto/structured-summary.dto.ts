import { ApiProperty } from '@nestjs/swagger';

export class StructuredSummaryDTO {
  @ApiProperty({
    example:
      'The website offers premium gym wear specifically tailored for Indian skin and body types...',
    description: 'High-level description of what the business offers.',
  })
  productOrService: string | null;

  @ApiProperty({
    example: 'Retail category, specifically fitness apparel or athletic wear.',
    description: 'The broader business classification or industry segment.',
  })
  businessCategory: string | null;

  @ApiProperty({
    example:
      'Fitness enthusiasts in India looking for high-quality gym wear suited to Indian body types.',
    description:
      'The primary audience or customer group targeted by the business.',
  })
  targetAudience: string | null;
}
