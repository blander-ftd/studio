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

interface FileListProps {
  files: UploadedFile[];
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function FileList({ files }: FileListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
            <CardTitle>Archivos Cargados</CardTitle>
            <CardDescription>Una lista de sus archivos cargados recientemente.</CardDescription>
        </div>
        <div>
            <Button disabled={files.length === 0} size="lg">Procesar Archivos</Button>
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
              <TableHead className="text-right">Estado</TableHead>
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
                  <TableCell className="text-right">
                    <Badge variant="outline" className="border-green-500 text-green-600">Procesado</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
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
