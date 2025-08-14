
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
});

export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

const ProductSchema = z.object({
    // For fields that can be null, avoid description/default to satisfy Google schema limits on anyOf
    provider_code: z.union([z.string(), z.null()]).optional(),
    product_code: z.number().int().describe("The product's code (EAN/EAN13 or internal SKU) as integer."),
    product_description: z.string().describe("The full description of the product."),
    brand: z.string().describe("The brand name of the product."),
    category: z.string().describe("The category of the product."),
    psl_discount: z.union([z.number(), z.null()]).optional(),
    pvp_discount: z.union([z.number(), z.null()]).optional(),
    discount_description: z.string().optional(),
    minimum_purchase_quantity: z.union([z.number().int(), z.null()]).optional(),
    offer_conditions: z.union([z.string(), z.null()]).optional(),
});

const ExtractDataOutputSchema = z.object({
  products: z.array(ProductSchema),
});

export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

import { getSecret } from '@/lib/secret-manager';

const basePromptEnv = process.env.BASE_PROMPT;
const basePrompt = basePromptEnv && basePromptEnv.length > 0 ? basePromptEnv : `Extract product promotion data from the provided file. Your response MUST be only the valid JSON output that matches the schema, with no additional text or explanations.

The JSON schema is:
{
  "products": [
    {
      "provider_code": "string",
      "product_code": "integer",
      "product_description": "string",
      "brand": "string",
      "category": "string",
      "psl_discount": "number|null",
      "pvp_discount": "number|null",
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
6.  **psl_discount**: Extract the PSL discount percentage as a number (0-100). Example: '20% dto sobre PSL' -> 20. This is the most important discount type.
7.  **pvp_discount**: Extract the PVP discount percentage as a number (0-100). Example: '40% dto sobre PVP' -> 40.
8.  **discount_description**: Combine all available discount fields and conditions (e.g., '% Dto. TRANSFER', 'Dinámica Consumidor final', '% Dto. PSL.', discount condition descriptions).
9.  **minimum_purchase_quantity**: Extract only integer values from columns like 'Unid. Minimas' or 'Compra mínima'. If no integer is found, this should be null.
10. **offer_conditions**: Extract any additional offer text, like '2da al 70%' or 'Se puede combinar'.

CRITICAL INSTRUCTIONS:
-   **DO NOT** include any product object in the 'products' array if it is missing a 'provider_code', 'product_code', or 'product_description'.
-   Your entire response must be ONLY the JSON object. Do not wrap it in markdown or add any commentary.
-   Handle data quirks like inconsistent spacing in PDFs or metadata in CSV headers gracefully.
-   Return null for fields where data is genuinely missing, except for the required fields mentioned above.
-   PSL discount is the priority discount type - ensure it's properly extracted when available.`;

const extractDataPrompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: { schema: z.object({ fileContent: z.string() }) },
  output: { schema: ExtractDataOutputSchema },
  prompt: `${basePrompt}

File (text/csv):
{{{fileContent}}}
`,
});


const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async (input) => {
    // Ensure GOOGLE_API_KEY is resolved at runtime from Secret Manager if not present
    if (!process.env.GOOGLE_API_KEY) {
      try {
        const key = await getSecret('GOOGLE_API_KEY');
        process.env.GOOGLE_API_KEY = key;
      } catch {
        throw new Error(
          'Missing GOOGLE_API_KEY environment variable and failed to load from Secret Manager.'
        );
      }
    }
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
    
    let output: ExtractDataOutput | undefined | null;
    try {
      ({ output } = await extractDataPrompt({ fileContent }));
    } catch (e: any) {
      // Surface a concise error so the API layer can return JSON instead of HTML error pages
      const message = e?.message || 'AI extraction failed';
      throw new Error(`AI extraction error: ${message}`);
    }

    // Gracefully handle cases where the AI returns no valid output.
    if (!output || !output.products) {
      return { products: [] };
    }
    
    // Final validation to ensure data integrity before returning
    const validatedProducts = output.products.filter(
      p => Boolean(p.provider_code) && Boolean(p.product_code) && Boolean(p.product_description)
    );

    return { products: validatedProducts };
  }
);
