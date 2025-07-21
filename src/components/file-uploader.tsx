"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import type { UploadedFile } from "@/types";

interface FileUploaderProps {
  onUploadComplete: (file: Omit<UploadedFile, 'status' | 'processedData' | 'icon'>) => void;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: File[]) => {
      const validFiles = Array.from(files).filter(file =>
        Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)
      );

      if (validFiles.length !== files.length) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos de Excel (.xls, .xlsx) y PDF (.pdf).",
          variant: "destructive",
        });
      }

      const newUploads: UploadingFile[] = validFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
      }));

      setUploadingFiles(prev => [...prev, ...newUploads]);

      newUploads.forEach(upload => {
        const interval = setInterval(() => {
          setUploadingFiles(prev =>
            prev.map(f => {
              if (f.id === upload.id) {
                const newProgress = f.progress + 5;
                if (newProgress >= 100) {
                  clearInterval(interval);
                  setTimeout(() => {
                    const fileType = f.file.type === 'application/pdf' ? 'PDF' : 'Excel';
                    onUploadComplete({
                        id: f.id,
                        name: f.file.name,
                        size: f.file.size,
                        type: fileType,
                        uploadDate: new Date(),
                        file: f.file,
                    });
                    setUploadingFiles(current => current.filter(uf => uf.id !== f.id));
                  }, 300);
                  return { ...f, progress: 100 };
                }
                return { ...f, progress: newProgress };
              }
              return f;
            })
          );
        }, 100);
      });
    },
    [onUploadComplete, toast]
  );

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-4">
        <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out bg-muted/50
                ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted"}`}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileSelect}
                className="hidden"
                multiple
                accept={Object.keys(ACCEPTED_FILE_TYPES).join(',')}
            />
            <UploadCloud className={`h-12 w-12 mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            <p className="mb-2 text-sm text-center text-muted-foreground">
                <span className="font-semibold text-primary">Haga clic para cargar</span> o arrastre y suelte
            </p>
            <p className="text-xs text-muted-foreground">Soporta: .pdf, .xls, .xlsx</p>
        </div>
        {uploadingFiles.length > 0 && (
            <div className="space-y-2">
                <h3 className="text-sm font-medium">Cargando...</h3>
                {uploadingFiles.map(upload => (
                <div key={upload.id} className="p-2 border rounded-lg flex items-center gap-4">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium truncate max-w-xs">{upload.file.name}</span>
                        <span className="text-muted-foreground">{upload.progress}%</span>
                    </div>
                    <Progress value={upload.progress} className="h-2" />
                    </div>
                </div>
                ))}
            </div>
        )}
    </div>
  );
}
