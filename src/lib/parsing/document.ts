import mammoth from "mammoth";

/** Extract raw text from an uploaded RFP (PDF or DOCX). */
export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    // pdf-parse is CommonJS; dynamic import keeps it out of the edge bundle.
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (lower.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  throw new Error("Unsupported file type. Upload a PDF or DOCX.");
}
