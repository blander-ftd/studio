import type { ReactNode } from "react";
import { z } from "zod";

export type FileStatus = "Pendiente" | "Procesando" | "Procesado" | "Error";

const GeneralDataSchema = z.object({
  file_name: z.string(),
  supplier: z.string(),
  month: z.string(),
});

const ProductPromotionSchema = z.object({
  product_code: z.string(),
  product_description: z.string(),
  brand: z.string(),
  category: z.string(),
  psl_discount: z.number().nullable(),
  pvp_discount: z.number().nullable(),
  discount_description: z.string(),
  minimum_purchase_quantity: z.number().nullable(),
  offer_conditions: z.string().nullable(),
});

const ComboProductSchema = z.object({
  product_code: z.string(),
  product_description: z.string(),
  brand: z.string(),
  category: z.string(),
  minimum_purchase_quantity: z.number().nullable(),
});

const ComboPromotionSchema = z.object({
  type: z.enum(["percentage", "fixed"]).nullable(),
  value: z.number().nullable(),
  combo_id: z.string(),
  products: z.array(ComboProductSchema),
});

const ProcessedDataSchema = z.object({
  general_data: GeneralDataSchema,
  promotions: z.object({
    products: z.array(ProductPromotionSchema),
    combos: z.array(ComboPromotionSchema),
  }),
});

export type ProcessedData = z.infer<typeof ProcessedDataSchema>;

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: "PDF" | "Excel";
  uploadDate: Date;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  icon: ReactNode;
  status: FileStatus;
  processedData: ProcessedData | null;
  file: File;
};
