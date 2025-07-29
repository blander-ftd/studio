
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
      "A file (Excel or PDF) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileType: z.enum(['pdf', 'excel']).describe('The type of the file provided.'),
});

export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

const ProductSchema = z.object({
    UPC: z.string().describe("The product's UPC, EAN, or internal code."),
    "Nombre fabricante": z.string().describe("The name of the product manufacturer."),
    "% costo de oferta PSL": z.number().nullable().describe("The percentage discount for the PSL offer."),
    "Monto mínimo de la oferta": z.number().nullable().describe("The minimum amount for the offer."),
});

const ExtractDataOutputSchema = z.object({
  products: z.array(ProductSchema).describe("A list of extracted products."),
});

export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;

export async function extractData(input: ExtractDataInput): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

const extractDataPrompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: { schema: ExtractDataInputSchema },
  output: { schema: ExtractDataOutputSchema },
  prompt: `Extract product promotion data from the provided files and return a JSON list matching this schema:
{
  "products": [
    {
      "UPC": "string",
      "Nombre fabricante": "string", 
      "% costo de oferta PSL": "number|null",
      "Monto mínimo de la oferta": "number|null"
    }
  ]
}

The file is provided as a binary blob. Analyze its content to determine if it is a PDF or an Excel file and extract the data accordingly.

Follow these extraction rules:
1. **UPC**: Prioritize EAN/EAN13 values > UPC codes > Internal codes (such as EAN or an internal SKU) > Parse from description
2. **Nombre fabricante**: Use 'Fabricante'/'Marca'/'MARCA'/'Línea'/'Proveedor' columns (e.g., ESPADOL, VEET, Dove)
3. **% costo de oferta PSL**: Extract percentage values from 'PSL'/'% Dto. PSL'/'Descuento PSL'/'Costo oferta PSL' columns (convert to decimal if needed)
4. **Monto mínimo de la oferta**: Extract monetary amounts from 'Monto mínimo'/'Compra mínima'/'Valor mínimo'/'Minimum amount' fields

Handle data quirks:
- PDF tables may have inconsistent spacing
- Some CSVs have header rows with metadata
- Discounts and amounts appear in multiple columns/formats
- Convert percentage strings to numbers (e.g., "15%" → 15)
- Convert currency strings to numbers (e.g., "$1,500" → 1500)
- Null values when data is missing

Return only valid JSON output with no additional text. Do not include empty objects in the products array.

File ({{fileType}}): {{media url=fileDataUri}}
`,
});

const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async (input) => {
    let finalInput = { ...input };

    if (input.fileType === 'excel') {
      const base64Data = input.fileDataUri.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const csvData = xlsx.utils.sheet_to_csv(worksheet);
      const csvBase64 = Buffer.from(csvData).toString('base64');
      
      finalInput.fileDataUri = `data:text/csv;base64,${csvBase64}`;
    }
    
    const { output } = await extractDataPrompt(finalInput);

    if (!output) {
      return { products: [] };
    }
    
    // Filter out any products that are missing required fields
    const validProducts = output.products.filter(product => {
        return product.UPC && product["Nombre fabricante"];
    });

    return { products: validProducts };
  }
);
