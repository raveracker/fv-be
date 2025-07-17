import { RawDataDTO } from './rawdata.dto';
import { StructuredSummaryDTO } from './structured-summary.dto';

export class StructuredResponseDTO {
  summary: StructuredSummaryDTO;

  rawData: RawDataDTO;

  rawText: string;
}
