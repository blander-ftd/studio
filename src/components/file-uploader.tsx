
"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import type { UploadedFile } from "@/types";

interface FileUploaderProps {
  onUploadComplete: (files: (Omit<UploadedFile, 'status' | 'processedData' | 'icon'> & { file: File })[]) => void;
  existingFiles: UploadedFile[];
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

export function FileUploader({ onUploadComplete, existingFiles }: FileUploaderProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];

      if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
          toast({
              title: "Tipo de archivo no válido",
              description: `El archivo "${file.name}" no es soportado. Solo se permiten archivos Excel y PDF.`,
              variant: "destructive",
          });
          return;
      }
      
      const isDuplicate = existingFiles.some(existingFile => 
          existingFile.name === file.name && existingFile.size === file.size
      );
      
      if (isDuplicate) {
          toast({
              title: "Archivo duplicado",
              description: `El archivo "${file.name}" ya ha sido cargado.`,
              variant: "destructive",
          });
          return;
      }

      const newUpload: UploadingFile = {
        id: crypto.randomUUID(),
        file,
        progress: 0,
      };

      setUploadingFiles([newUpload]);

      const simulateUpload = (upload: UploadingFile) => {
          const interval = setInterval(() => {
            setUploadingFiles(prev =>
                prev.map(f => {
                    if (f.id === upload.id) {
                        const newProgress = f.progress + 10;
                        if (newProgress >= 100) {
                            clearInterval(interval);
                            
                            setTimeout(() => {
                                const fileType = f.file.type === 'application/pdf' ? 'PDF' : 'Excel';
                                onUploadComplete([{
                                    id: f.id,
                                    name: f.file.name,
                                    size: f.file.size,
                                    type: fileType,
                                    uploadDate: new Date(),
                                    file: f.file,
                                }]);

                                setUploadingFiles(current => current.filter(uf => uf.id !== f.id));
                            }, 500);

                            return { ...f, progress: 100 };
                        }
                        return { ...f, progress: newProgress };
                    }
                    return f;
                })
            );
          }, 100);
      };

      simulateUpload(newUpload);
    },
    [onUploadComplete, toast, existingFiles]
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
    handleFiles(e.dataTransfer.files);
  };
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
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
            className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out bg-muted
                ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileSelect}
                className="hidden"
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
