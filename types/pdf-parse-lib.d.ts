declare module "pdf-parse/lib/pdf-parse.js" {
  import type { Buffer } from "node:buffer";

  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  }

  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: Record<string, unknown>
  ): Promise<PDFParseResult>;

  export default pdfParse;
}
