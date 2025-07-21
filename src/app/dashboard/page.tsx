"use client";

import { useState } from "react";

import { FileList } from "@/components/file-list";
import { FileUploader } from "@/components/file-uploader";
import type { UploadedFile } from "@/types";
import { FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from 'xlsx';

export default function DashboardPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleUploadComplete = async (
    newFile: Omit<UploadedFile, "status" | "processedData">
  ) => {
    // Create a new file object with initial status and processedData
    const fileWithStatus: UploadedFile = {
      ...newFile,
      status: "Sin procesar",
      processedData: null,
    };

    // Assign icon based on file type
    if (fileWithStatus.type === "PDF") {
      fileWithStatus.icon = <FileText className="h-6 w-6 text-destructive" />;
    } else {
      fileWithStatus.icon = (
        <FileSpreadsheet className="h-6 w-6 text-green-500" />
      );
    }

    setFiles((prevFiles) => {
      // Prevent adding duplicates
      if (prevFiles.some((file) => file.id === newFile.id)) {
        return prevFiles;
      }
      return [fileWithStatus, ...prevFiles];
    });

    // Automatically process the newly uploaded file
    const formData = new FormData();

    if (fileWithStatus.type === "PDF") {
      // If it's a PDF, just send the file as is
      formData.append("file", fileWithStatus.file);
    } else {
      // If it's an Excel file, convert to plain text and send
      try {
        const textData = await convertExcelToText(fileWithStatus.file);
        const textFile = new File([textData], `${fileWithStatus.name}.txt`, {
          type: "text/plain",
        });
        formData.append("file", textFile);
      } catch (error) {
        console.error("Error converting Excel to text:", error);
        // Handle conversion error, maybe update file status
        return;
      }
    }

    const apiUrl = "YOUR_API_URL"; // Replace with your actual API endpoint

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: [fileWithStatus] }), // Process only the new file
      });

      // Send the file (original PDF or converted text) to your API
      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error processing file: ${response.statusText}`);
      }
      if (!apiResponse.ok) {
        throw new Error(`Error sending file to API: ${apiResponse.statusText}`);
      }
    
    } catch (error) {
      console.error("Error processing file:", error);
      // Optionally, update file status to an error state here
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
  };

  // handleProcessFiles is no longer needed as processing happens on upload

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Inicio
          </h1>
        </div>
        <FileUploader onUploadComplete={handleUploadComplete} />
        <FileList
          files={files}
          onRemoveFile={handleRemoveFile}
          onProcessFiles={() => {}} // Pass an empty function as it's not needed anymore
        />
      </div>
    </div>
  );
}

async function convertExcelToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const text = XLSX.utils.sheet_to_txt(worksheet);
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(file);
  });
}
