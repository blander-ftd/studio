
"use client";

import type { UploadedFile } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Eye, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
  onRetryProcess: (fileId: string) => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function FileList({ files, onRemoveFile, onRetryProcess }: FileListProps) {

  const handleViewClick = (file: UploadedFile) => {
    // Stringify file object to store in sessionStorage, excluding the raw 'file' property
    const { file: rawFile, ...fileToStore } = file;
    try {
      sessionStorage.setItem('selectedFile', JSON.stringify(fileToStore));
    } catch (error) {
      console.error("Could not save file to sessionStorage", error);
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
            <CardTitle>Archivos Cargados</CardTitle>
            <CardDescription>Una lista de sus archivos cargados recientemente.</CardDescription>
        </div>
        <Button>Hacer Excel</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Tipo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Fecha de Carga</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length > 0 ? (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-muted">
                        {file.icon}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell>
                    {new Date(file.uploadDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("gap-1", {
                          "border-yellow-500 text-yellow-600": file.status === "Pendiente",
                          "border-blue-500 text-blue-600": file.status === "Procesando",
                          "border-green-500 text-green-600": file.status === "Procesado",
                          "border-red-500 text-red-600": file.status === "Error",
                      })}
                    >
                       {(file.status === "Procesando" || file.status === "Pendiente") && <Loader2 className="h-3 w-3 animate-spin" />}
                      {file.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {file.status === "Error" && (
                        <Button variant="ghost" size="icon" onClick={() => onRetryProcess(file.id)}>
                            <RefreshCw className="h-4 w-4" />
                            <span className="sr-only">Reintentar</span>
                        </Button>
                      )}
                      {file.status === "Procesado" && (
                        <Button variant="ghost" size="icon" asChild onClick={() => handleViewClick(file)}>
                            <Link href={`/dashboard/file/${file.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                            </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => onRemoveFile(file.id)}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Aún no se han cargado archivos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
