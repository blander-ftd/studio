
'use server';
/**
 * @fileOverview A Genkit flow for extracting product promotion data from files.
 *
 * - extractData - A function that handles the data extraction process.
 * - ExtractDataInput - The input type for the extractData function.
 * - ExtractDataOutput - The return type for the extractData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as xlsx from 'xlsx';

const ExtractDataInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A file (Excel or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  fileType: z.enum(['pdf', 'excel']).describe('The type of the file provided.'),
  fileName: z.string().optional().describe('Original file name (optional).'),
  fileSize: z.number().optional().describe('Original file size in bytes (optional).'),
});

export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

const ProductSchema = z.object({
    provider_code: z.string().describe("The provider code from the file."),
    product_code: z.string().describe("The product's code (EAN/EAN13 or internal SKU)."),
    product_description: z.string().describe("The full description of the product."),
    brand: z.string().describe("The brand name of the product."),
    category: z.string().describe("The category of the product."),
    discount_description: z.string().describe("A combined description of all applicable discounts."),
    minimum_purchase_quantity: z.number().nullable().describe("The minimum quantity required for the offer."),
    offer_conditions: z.string().nullable().describe("Specific conditions for the offer."),
});

const ExtractDataOutputSchema = z.object({
  products: z.array(ProductSchema).describe("A list of extracted products. Do not include empty or incomplete objects in this array."),
});

export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

const basePrompt = `Extract product promotion data from the provided file. Your response MUST be only the valid JSON output that matches the schema, with no additional text or explanations.

The JSON schema is:
{
  "products": [
    {
      "provider_code": "string",
      "product_code": "integer",
      "product_description": "string",
      "brand": "string",
      "category": "string",
      "discount_description": "string",
      "minimum_purchase_quantity": "integer|null",
      "offer_conditions": "string|null"
    }
  ]
}

Follow these extraction rules VERY CAREFULLY:
1.  **provider_code**: Extract this from the file content. It is a required field.
2.  **product_code**: This is a required field. Prioritize EAN/EAN13 values, then internal codes (like SKU). If none are available, try to parse it from the description, but it cannot be empty.
3.  **product_description**: This is a required field. Combine product name/description columns (e.g., 'Producto', 'Descripción SKU') with presentation columns (e.g., 'PRESENTACION').
4.  **brand**: Extract from 'Marca', 'MARCA', or 'Línea' columns.
5.  **category**: Extract from 'Categoría', 'Negocio', or from section headers (e.g., 'ANALGESICOS & ANTIINFLAMATORIOS').
6.  **discount_description**: Combine all available discount fields (e.g., '% Dto. TRANSFER', 'Dinámica Consumidor final', '% Dto. PSL.').
7.  **minimum_purchase_quantity**: Extract only integer values from columns like 'Unid. Minimas' or 'Compra mínima'. If no integer is found, this should be null.
8.  **offer_conditions**: Extract any additional offer text, like '2da al 70%' or 'Se puede combinar'.

CRITICAL INSTRUCTIONS:
-   **DO NOT** include any product object in the 'products' array if it is missing a 'provider_code', 'product_code', or 'product_description'.
-   Your entire response must be ONLY the JSON object. Do not wrap it in markdown or add any commentary.
-   Handle data quirks like inconsistent spacing in PDFs or metadata in CSV headers gracefully.
-   Return null for fields where data is genuinely missing, except for the required fields mentioned above.`;

const extractDataPrompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: { schema: z.object({ fileContent: z.string() }) },
  output: { schema: ExtractDataOutputSchema },
  prompt: `${basePrompt}

File (text/csv):
{{{fileContent}}}
`,
  pdfPrompt: `${basePrompt}

File (pdf):
{{media url=fileContent}}
`,
});


const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async (input) => {
    let fileContent = input.fileDataUri;
    const isPdf = input.fileType === 'pdf';

    if (input.fileType === 'excel') {
      try {
        const base64Data = input.fileDataUri.split(',')[1];
        if (!base64Data) {
          throw new Error("Invalid Data URI format for Excel file.");
        }
        const buffer = Buffer.from(base64Data, 'base64');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        fileContent = xlsx.utils.sheet_to_csv(worksheet);
      } catch (e: any) {
        console.error("Error parsing excel file: ", e);
        // Throw a more specific error that can be caught by the API route
        throw new Error(`Could not parse the Excel file. It may be corrupted or in an unsupported format. Details: ${e.message}`);
      }
    }
    
    const { output } = isPdf
      ? await extractDataPrompt.pdf({ fileContent })
      : await extractDataPrompt({ fileContent });

    // Gracefully handle cases where the AI returns no valid output.
    if (!output || !output.products) {
      return { products: [] };
    }
    
    // Final validation to ensure data integrity before returning
    const validatedProducts = output.products.filter(p => p.product_code && p.product_description);

    return { products: validatedProducts };
  }
);
