"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}


export default function FileDetailClient({ file }: { file: any }) {

  if (!file) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-2xl font-bold">Archivo no encontrado</h1>
            <p className="text-muted-foreground">El archivo que busca no existe o ha sido eliminado.</p>
            <Button asChild className="mt-4">
                <Link href="/dashboard">Volver al Inicio</Link>
            </Button>
        </div>
    );
  }

  const renderDataPreview = () => {
    if (!file.processedData) {
        return <p className="text-muted-foreground">Aún no hay datos procesados para este archivo.</p>
    }

    if (Array.isArray(file.processedData.preview) && file.processedData.columns) {
        return (
             <Table>
                <TableHeader>
                    <TableRow>
                        {file.processedData.columns.map((col: string) => <TableHead key={col}>{col}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {file.processedData.preview.map((row: any, index: number) => (
                        <TableRow key={index}>
                           {file.processedData.columns.map((col: string) => <TableCell key={col}>{row[col]}</TableCell>)}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    return (
        <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
            {JSON.stringify(file.processedData, null, 2)}
        </pre>
    )
  }

  return (
    <div className="flex-1 space-y-4">
       <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {file.name}
          </h1>
          <Badge variant="outline" className="ml-auto sm:ml-0">
            {file.status}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Archivo</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground flex-shrink-0">Nombre</span>
                        <span className="truncate" title={file.name}>{file.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tipo</span>
                        <span>{file.type}</span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tamaño</span>
                        <span>{formatBytes(file.size)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fecha de Carga</span>
                        <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                    </div>
                </CardContent>
            </Card>
            {file.processedData && (
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Resumen del Procesamiento</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                         <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Resumen</span>
                            <span>{file.processedData.summary}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Filas Encontradas</span>
                            <span>{file.processedData.rowCount}</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Vista Previa de Datos</CardTitle>
                <CardDescription>
                    Una muestra de los datos extraídos del archivo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderDataPreview()}
            </CardContent>
        </Card>
    </div>
  )
}
