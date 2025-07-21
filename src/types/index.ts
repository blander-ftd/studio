import type { ReactNode } from "react";

export type FileStatus = "Sin procesar" | "Procesado" | "Error";

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: "PDF" | "Excel";
  uploadDate: Date;
  icon: ReactNode;
  status: FileStatus;
  processedData: any | null;
  file: File;
};
