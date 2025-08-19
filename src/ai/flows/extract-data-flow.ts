
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
  uploadedBy: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional().describe('User who uploaded the file (optional).'),
});

export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

const GeneralDataSchema = z.object({
  file_name: z.string().describe("The name of the processed file."),
  supplier: z.string().describe("The supplier identified from the file."),
  month: z.string().regex(/^\d{4}-\d{2}$/).describe("The month of validity in YYYY-MM format."),
});

const ProductPromotionSchema = z.object({
  product_code: z.coerce.number(),
  product_description: z.string(),
  brand: z.string(),
  category: z.string(),
  psl_discount: z.number().nullable(),
  pvp_discount: z.number().nullable(),
  discount_description: z.string(),
  minimum_purchase_quantity: z.number(),
  offer_conditions: z.string().nullable(),
});

const ComboProductSchema = z.object({
  product_code: z.coerce.number(),
  product_description: z.string(),
  brand: z.string(),
  category: z.string(),
  minimum_purchase_quantity: z.number(),
});

const ComboPromotionSchema = z.object({
  type: z.enum(["percentage", "fixed"]).nullable(),
  value: z.number().nullable(),
  combo_id: z.string(),
  products: z.array(ComboProductSchema),
});

const PromotionsSchema = z.object({
  products: z.array(ProductPromotionSchema).describe("A list of individual product promotions."),
  combos: z.array(ComboPromotionSchema).describe("A list of combo promotions, in which there is a list of individual products in the combo."),
});

const ExtractDataOutputSchema = z.object({
  general_data: GeneralDataSchema,
  promotions: PromotionsSchema,
});

export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}


const extractDataPrompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: { schema: z.object({ fileContent: z.string(), fileName: z.string().optional() }) },
  output: { schema: ExtractDataOutputSchema },
  prompt: `${process.env.BASE_PROMPT}

File: {{{fileName}}}
Content (text/csv):
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

        // Concatenate all sheets into a single CSV string, separated by sheet name headers
        let allSheetsCsv = '';
        workbook.SheetNames.forEach((sheetName, idx) => {
          const worksheet = workbook.Sheets[sheetName];
          const csv = xlsx.utils.sheet_to_csv(worksheet);
          // Add a header for each sheet to distinguish them
          allSheetsCsv += `--- Sheet: ${sheetName} ---\n${csv}\n`;
        });
        fileContent = allSheetsCsv;
      } catch (e: any) {
        console.error("Error parsing excel file: ", e);
        // Throw a more specific error that can be caught by the API route
        throw new Error(`Could not parse the Excel file. It may be corrupted or in an unsupported format. Details: ${e.message}`);
      }
    }
    
    const { output } = await extractDataPrompt({ fileContent, fileName: input.fileName });

    // Gracefully handle cases where the AI returns no valid output.
    if (!output) {
      throw new Error("The AI model did not return any data.");
    }
    
    // Ensure the original file name is preserved, overriding anything the AI might have hallucinated.
    if (input.fileName) {
      output.general_data.file_name = input.fileName;
    }
    
    // Handle cases where promotions might be missing or have unexpected structure
    if (!output.promotions) {
      output.promotions = { products: [], combos: [] };
    }
    
    // Ensure products and combos arrays exist
    if (!Array.isArray(output.promotions.products)) {
      output.promotions.products = [];
    }
    
    if (!Array.isArray(output.promotions.combos)) {
      output.promotions.combos = [];
    }
    
    // Final validation to ensure data integrity before returning
    const validatedProducts = output.promotions.products.filter(p => {
      const { success } = ProductPromotionSchema.safeParse(p);
      return success;
    });

    const validatedCombos = output.promotions.combos.filter(c => {
        const { success } = ComboPromotionSchema.safeParse(c);
        return success;
    });

    return { 
      general_data: output.general_data,
      promotions: {
        products: validatedProducts,
        combos: validatedCombos,
      }
    };
  }
);
