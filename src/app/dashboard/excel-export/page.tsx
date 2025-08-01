
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

  const handleGenerateExcel = () => {
    if (date?.from && date?.to) {
      // Placeholder for actual Excel generation logic
      console.log(
        `Generando Excel para el rango: ${date.from.toLocaleDateString()} - ${date.to.toLocaleDateString()}`
      );
      toast({
        title: "Generación Iniciada",
        description: `Se está generando el Excel para el rango seleccionado.`,
      })
    } else {
       toast({
        title: "Error",
        description: "Por favor seleccione un rango de fechas.",
        variant: "destructive",
      });
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
