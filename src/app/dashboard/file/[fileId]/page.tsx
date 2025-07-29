
"use client";

import { Suspense, useEffect, useState } from "react";
import FileDetailClient from "./file-detail-client";
import type { UploadedFile } from "@/types";

// This component is now a client component to access sessionStorage
export default function FileDetailPage({ params: { fileId } }: { params: { fileId: string } }) {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedFileJson = sessionStorage.getItem('selectedFile');
      if (storedFileJson) {
        const storedFile = JSON.parse(storedFileJson);
        // We only show the details if the ID from the URL matches the one in storage
        if (storedFile.id === fileId) {
            // We need to convert date strings back to Date objects
            const hydratedFile = {
                ...storedFile,
                uploadDate: new Date(storedFile.uploadDate),
            };
            setFile(hydratedFile);
        }
      }
    } catch (error) {
      console.error("Failed to parse file data from sessionStorage", error);
      setFile(null);
    } finally {
        setLoading(false);
    }
  }, [fileId]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FileDetailClient file={file} />
    </Suspense>
  )
}
