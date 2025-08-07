
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FileSpreadsheet, Download } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";


export default function ExcelExportPage() {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();

  const handleGenerateExcel = async () => {
    if (!date?.from || !date?.to) {
      toast({
        title: "Error",
        description: "Por favor seleccione un rango de fechas.",
        variant: "destructive",
      });
      return;
    }

    const formatDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`; // YYYY-MM-DD
    };

    const startDate = formatDate(date.from);
    const endDate = formatDate(date.to);

    toast({
      title: "Generación iniciada",
      description: `Solicitando datos del ${startDate} al ${endDate}...`,
    });

    try {
      const response = await fetch(
        "https://transfer-argentina-request-633589706319.us-central1.run.app",
        {
          method: "GET",
          headers: {
            "Private-Key": "zGVyST9fxdqBwQUKYqF0WE15Agq7UCIA",
            "Start-Date": startDate,
            "End-Date": endDate,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error de solicitud: ${response.status} ${errorText}`);
      }

      const json = await response.json();

      const toArrayOfObjects = (data: unknown): Record<string, any>[] => {
        if (Array.isArray(data)) return data as Record<string, any>[];
        if (data && typeof data === "object") {
          // Try common wrapper shapes: { data: [...] } or { items: [...] }
          const maybe = (data as any).data || (data as any).items || (data as any).results;
          if (Array.isArray(maybe)) return maybe as Record<string, any>[];
          return [data as Record<string, any>];
        }
        return [];
      };

      const rows = toArrayOfObjects(json);

      if (rows.length === 0) {
        toast({ title: "Sin datos", description: "No se recibieron resultados para el rango." });
        return;
      }

      const headers = Array.from(
        rows.reduce<Set<string>>((set, row) => {
          Object.keys(row ?? {}).forEach((k) => set.add(k));
          return set;
        }, new Set<string>())
      );

      const escapeCell = (val: unknown): string => {
        if (val === null || val === undefined) return "";
        const s = String(val).replace(/"/g, '""');
        if (/[",\n]/.test(s)) return `"${s}"`;
        return s;
      };

      const csvLines: string[] = [];
      csvLines.push(headers.join(","));
      for (const row of rows) {
        const line = headers.map((h) => escapeCell((row as any)[h]));
        csvLines.push(line.join(","));
      }

      const csvContent = csvLines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const fileName = `reporte_${startDate}_${endDate}.csv`;
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Exportación completa", description: `Descargado ${fileName}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({ title: "Error al generar", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Exportar a Excel
          </h1>
      </div>
       <Card>
            <CardHeader>
                <CardTitle>Generar Reporte</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                <div className="grid gap-2">
                    <DateRangePicker date={date} onDateChange={setDate} />
                    <p className="text-sm text-muted-foreground">
                        Seleccione el rango de fechas para la exportación.
                    </p>
                </div>
                <Button onClick={handleGenerateExcel} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Generar Excel
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
