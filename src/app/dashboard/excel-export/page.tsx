
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
      // Add a timeout to avoid hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);

      // Call our server-side proxy to avoid CORS and hide secrets
      const requestUrl = `/api/export?startDate=${startDate}&endDate=${endDate}`;
      const requestInit: RequestInit = { method: "GET", signal: controller.signal };

      const response = await fetch(requestUrl, requestInit);
      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") || "";
      const traceHeader =
        response.headers.get("x-cloud-trace-context") ||
        response.headers.get("x-request-id") ||
        undefined;

      const readBodySafely = async () => {
        try {
          if (contentType.includes("application/json")) {
            const data = await response.clone().json();
            return { asText: JSON.stringify(data), asJson: data } as const;
          }
          const text = await response.clone().text();
          return { asText: text, asJson: undefined } as const;
        } catch {
          return { asText: "<no body / failed to read>", asJson: undefined } as const;
        }
      };

      if (!response.ok) {
        const body = await readBodySafely();
        const details = {
          url: requestUrl,
          status: response.status,
          statusText: response.statusText,
          contentType,
          trace: traceHeader,
          bodyPreview: body.asText?.slice(0, 2_000),
        };
        // Log full details to console for debugging
        // eslint-disable-next-line no-console
        console.error("Excel export request failed", details);

        const humanHint =
          response.status === 0
            ? "La red o CORS puede estar bloqueando la solicitud. Revise la consola para más detalles."
            : response.status === 401 || response.status === 403
            ? "Credenciales inválidas o no autorizadas. Verifique 'Private-Key' y reglas de acceso."
            : response.status === 404
            ? "Endpoint no encontrado. Confirme la URL del servicio."
            : response.status >= 500
            ? "El servidor tuvo un error. Intente nuevamente o revise los logs del servicio."
            : undefined;

        throw new Error(
          `Error de solicitud ${response.status} ${response.statusText}` +
            (traceHeader ? ` | trace: ${traceHeader}` : "") +
            (humanHint ? ` | pista: ${humanHint}` : "") +
            (body.asText ? ` | cuerpo: ${body.asText.slice(0, 300)}` : "")
        );
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch (e) {
        const text = await response.text();
        // eslint-disable-next-line no-console
        console.error("La respuesta no es JSON válido, cuerpo:", text);
        throw new Error("La respuesta del servidor no es JSON válido. Revise la consola para ver el cuerpo.");
      }

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

      // Dynamically import xlsx only when needed (client-side)
      const XLSX = await import("xlsx");

      // Prepare worksheet data: first row is headers, then each row is a product
      const worksheetData = [
        headers,
        ...rows.map(row => headers.map(h => row[h] ?? ""))
      ];

      // Create worksheet and workbook
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

      // Generate Excel file as Blob
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const fileName = `reporte_${startDate}_${endDate}.xlsx`;
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Exportación completa", description: `Descargado ${fileName}` });
    } catch (error) {
      let message = "Error desconocido";
      if (error instanceof DOMException && error.name === "AbortError") {
        message = "Tiempo de espera agotado al contactar el servicio (timeout)";
      } else if (error instanceof Error) {
        message = error.message;
        if (/Failed to fetch/i.test(message)) {
          message =
            "No se pudo contactar al servicio (Failed to fetch). Posible CORS, red, DNS o certificado SSL. Revise la consola para detalles.";
        }
      }

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
