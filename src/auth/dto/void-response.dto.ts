import { ApiProperty } from '@nestjs/swagger';

export class VoidResponse {
  @ApiProperty({
    description: 'Void Response Message',
    example: 'Email Sent Successfully',
  })
  message: string;
}
