import type { ReactNode } from "react";

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: "PDF" | "Excel";
  uploadDate: Date;
  icon: ReactNode;
};
