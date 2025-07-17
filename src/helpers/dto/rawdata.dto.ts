import { OrganizationDTO } from './organization.dto';

export class RawDataDTO {
  title: string;

  h1: string;

  metaDescription: string;

  products: any[];

  organization: OrganizationDTO[];
}
