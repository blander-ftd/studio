
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
      "provider_code": "string",
      "product_code": "string",
      "product_description": "string",
      "brand": "string",
      "category": "string",
      "discount_description": "string",
      "minimum_purchase_quantity": "integer|null",
      "offer_conditions": "string|null"
    }
  ]
}

Follow these extraction rules:
1. **product_code**: Prioritize EAN/EAN13 values > Internal codes (like such as EAN or an internal SKU) > Parse from description
2. **product_description**: Combine 'Producto'/'Descripción SKU' + 'PRESENTACION' fields
3. **brand**: Use 'Marca'/'MARCA'/'Línea' columns (e.g., ESPADOL, VEET, Dove)
4. **category**: Use 'Categoría'/'Negocio' > Section headers (e.g., 'ANALGESICOS & ANTIINFLAMATORIOS')
5. **discount_description**: Combine all discount fields (e.g., 'Descuento TRANSFER' + 'Dinámica Consumidor final' + '% Dto. PSL.')
6. **minimum_purchase_quantity**: Extract integers from 'Unid. Minimas'/'Compra mínima' (ignore text)
7. **offer_conditions**: Include phrases like '2da al 70%', 'Se puede combinar'
8. **provider_code**: Extract the provider code from the file.

Handle data quirks:
- PDF tables may have inconsistent spacing
- Some CSVs have header rows with metadata
- Discounts appear in multiple columns/formats
- Null values when data is missing

Return only valid JSON output with no additional text. Do not include empty or incomplete objects in the products array.

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
    
    const { output } = await extractDataPrompt(input);

    if (!output) {
      return { products: [] };
    }
    
    const validProducts = output.products.filter(product => {
        return product.provider_code && product.product_code && product.product_description;
    });

    return { products: validProducts };
  }
);
