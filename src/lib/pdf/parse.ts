import pdfParse from "pdf-parse";

export interface ParsedPdf {
  text: string;
  pages: number;
  filename: string;
}

export async function parsePdf(
  buffer: Buffer,
  filename: string
): Promise<ParsedPdf> {
  const data = await pdfParse(buffer);

  if (!data.text || data.text.trim().length < 50) {
    throw new Error(
      "PDF appears to be empty or contains only images. Please use a text-based PDF."
    );
  }

  return {
    text: data.text,
    pages: data.numpages,
    filename,
  };
}
