
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { UploadedFile, ProcessedData } from "@/types";
import { FileSummary } from "./file-summary";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}


export default function FileDetailClient({ file }: { file: UploadedFile | null }) {

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

    const { promotions } = file.processedData;

    return (
      <div>
        {promotions.products && promotions.products.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Promociones de Productos</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Desc. PSL</TableHead>
                  <TableHead>Desc. PVP</TableHead>
                  <TableHead>Condiciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.products.map((product, index) => (
                  <TableRow key={`product-${index}`}>
                    <TableCell className="font-mono text-xs">{product.product_code}</TableCell>
                    <TableCell>{product.product_description}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.psl_discount ? `${(product.psl_discount * 100).toFixed(2)}%` : '-'}</TableCell>
                    <TableCell>{product.pvp_discount ? `${(product.pvp_discount * 100).toFixed(2)}%` : '-'}</TableCell>
                    <TableCell>{product.offer_conditions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {promotions.combos && promotions.combos.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Promociones de Combos</h3>
            {promotions.combos.map((combo, index) => (
              <div key={`combo-${index}`} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{combo.combo_id}</h4>
                  <Badge>{combo.type}: {combo.value}</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Categoría</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combo.products.map((product, pIndex) => (
                      <TableRow key={`combo-product-${pIndex}`}>
                        <TableCell className="font-mono text-xs">{product.product_code}</TableCell>
                        <TableCell>{product.product_description}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>{product.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </div>
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
                <CardContent className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Nombre</span>
                    <span className="truncate font-medium" title={file.name}>{file.name}</span>
                    
                    <span className="text-muted-foreground">Proveedor</span>
                    <span className="font-medium">{file.processedData?.general_data.supplier || 'N/A'}</span>

                    <span className="text-muted-foreground">Mes de Validez</span>
                    <span className="font-medium">{file.processedData?.general_data.month || 'N/A'}</span>

                    <span className="text-muted-foreground">Tipo</span>
                    <span className="font-medium">{file.type}</span>

                    <span className="text-muted-foreground">Tamaño</span>
                    <span className="font-medium">{formatBytes(file.size)}</span>
                    
                    <span className="text-muted-foreground">Fecha de Carga</span>
                    <span className="font-medium">{new Date(file.uploadDate).toLocaleDateString()}</span>
                </CardContent>
            </Card>
            {file.processedData && (
                <FileSummary processedData={file.processedData} />
            )}
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Datos Procesados</CardTitle>
                <CardDescription>
                   Visualización de los datos extraídos del archivo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderDataPreview()}
            </CardContent>
        </Card>
    </div>
  )
}
