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
import { X, Sparkles, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (fileId: string) => void;
  onProcessFiles: () => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function FileList({ files, onRemoveFile, onProcessFiles }: FileListProps) {
  const hasUnprocessedFiles = files.some(file => file.status === "Sin procesar");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
            <CardTitle>Archivos Cargados</CardTitle>
            <CardDescription>Una lista de sus archivos cargados recientemente.</CardDescription>
        </div>
        <div>
            <Button disabled={!hasUnprocessedFiles} size="lg" onClick={onProcessFiles}>
                <Sparkles className="mr-2 h-4 w-4" />
                Procesar Archivos
            </Button>
        </div>
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
                    {file.uploadDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn({
                          "border-yellow-500 text-yellow-600": file.status === "Sin procesar",
                          "border-green-500 text-green-600": file.status === "Procesado",
                      })}
                    >
                      {file.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/file/${file.id}`} passHref>
                      <Button variant="ghost" size="icon" asChild>
                        <a>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver</span>
                        </a>
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveFile(file.id)}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
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
