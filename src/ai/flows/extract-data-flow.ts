
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

const GeneralDataSchema = z.object({
  file_name: z.string().describe("The name of the processed file."),
  supplier: z.string().describe("The supplier identified from the file."),
  month: z.string().regex(/^\d{4}-\d{2}$/).describe("The month of validity in YYYY-MM format."),
});

const ProductPromotionSchema = z.object({
  product_code: z.string().optional(),
  product_description: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  psl_discount: z.number().nullable().optional(),
  pvp_discount: z.number().nullable().optional(),
  discount_description: z.string().optional(),
  minimum_purchase_quantity: z.number().nullable().optional(),
  offer_conditions: z.string().nullable().optional(),
});

const ComboProductSchema = z.object({
  product_code: z.string().optional(),
  product_description: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  minimum_purchase_quantity: z.number().nullable().optional(),
});

const ComboPromotionSchema = z.object({
  type: z.enum(["percentage", "fixed"]).nullable().optional(),
  value: z.number().nullable().optional(),
  combo_id: z.string().optional(),
  products: z.array(ComboProductSchema).optional(),
});

const ExtractDataOutputSchema = z.object({
  general_data: GeneralDataSchema,
  promotions: z.object({
    products: z.array(ProductPromotionSchema).describe("A list of individual product promotions."),
    combos: z.array(ComboPromotionSchema).describe("A list of combo promotions."),
  }),
});

export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

const basePrompt = `Role: You are a data extraction system that processes supplier promotion spreadsheets and outputs a unified JSON format capturing both individual product promotions and combo promotions. Task: Extract all product and combo promotion data from the provided file and return it strictly in the specified JSON structure, including general file metadata and month of validity. Context: The input files come from multiple suppliers with highly varied layouts. Some contain per-product discounts, others contain combo deals where multiple products are part of a single promotion (e.g., Genomma Lab). Each record must be normalized into a common structure with consistent fields. Reasoning: Identify general metadata (file_name, supplier, month) from headers, sheet titles, or file metadata. Map each relevant column from the file to the correct JSON field using the mapping examples provided. Extract product codes with priority: EAN → SKU → parsed from description. Merge product name and presentation for product_description. Extract PSL discounts first when multiple discount types are present. Capture both product-level promotions and combo promotions separately in their respective arrays. Explicitly set missing data to null except for required fields. Skip incomplete records that do not contain required fields. Mapping examples: general_data.file_name: file name from metadata; general_data.supplier: detected from headers, sheet titles, or text; general_data.month: month/year from headers or metadata; products.product_code: from EAN, EAN 13, Unnamed:0, SKU in Descripción SKU; products.product_description: Producto or Descripción SKU + Presentación; products.brand: Marca, MARCA, Línea; products.category: Categoría, Negocio, section headers; products.psl_discount: % ACA, % Dcto. PSL, Descuento TRANSFER; products.pvp_discount: % TRF, % Dcto. PVP, Dinámica Consumidor final; products.discount_description: combine all discount fields and conditions; products.minimum_purchase_quantity: Compra mínima, Unid. Mínimas; products.offer_conditions: free-text like “2da al 70%”; combos.type: derived from discount wording; combos.value: numeric discount; combos.combo_id: supplier + short description + month; combos.products.product_code: EAN or SKU; combos.products.product_description: name + presentation; combos.products.brand: brand or inferred; combos.products.category: category or section header; combos.products.minimum_purchase_quantity: integer if available. Output Format: { "general_data": { "file_name": "string", "supplier": "string", "month": "YYYY-MM" }, "promotions": { "products": [ { "product_code": "string", "product_description": "string", "brand": "string", "category": "string", "psl_discount": "number|null", "pvp_discount": "number|null", "discount_description": "string", "minimum_purchase_quantity": "integer|null", "offer_conditions": "string|null" } ], "combos": [ { "type": "percentage|fixed|null", "value": "number|null", "combo_id": "string", "products": [ { "product_code": "string", "product_description": "string", "brand": "string", "category": "string", "minimum_purchase_quantity": "integer|null" } ] } ] } } Stop Condition: Output only the JSON object matching the schema, no extra text. Do not include any product or combo missing required fields. Explicitly return null where data is missing. Handle inconsistent formatting and spacing gracefully.`;

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
    if (!output) {
      throw new Error("The AI model did not return any data.");
    }
    
    // Final validation to ensure data integrity before returning
    const validatedProducts = output.promotions.products.filter(p => p.product_code && p.product_description);
    const validatedCombos = output.promotions.combos.filter(c => c.combo_id && c.products.length > 0);

    return { 
      general_data: output.general_data,
      promotions: {
        products: validatedProducts,
        combos: validatedCombos,
      }
    };
  }
);
