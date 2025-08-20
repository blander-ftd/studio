
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FileSpreadsheet, Download } from "lucide-react";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, doc, deleteDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { useAuth } from "@/context/auth-context";
interface ProcessedFile {
  id: string;
  file_name: string;
  created_time: Timestamp;
  uploaded_by?: {
    id?: string;
    name: string;
    email?: string;
  };
  processedData?: any;
}

export default function ExcelExportPage() {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const router = useRouter();

  const handleViewClick = async (file: ProcessedFile) => {
    try {
      console.log("handleViewClick called with file:", file);

      const processedData = {
        general_data: {
          file_name: file.file_name,
          supplier: file.processedData?.general_data?.supplier || file.supplier,
          month: file.processedData?.general_data?.month || file.month,
        },
        promotions: {
          products: file.processedData?.promotions?.products || file.products || [],
          combos: file.processedData?.promotions?.combos || file.combos || [],
        },
      };

      console.log("Processed data constructed:", processedData);

      const transformedFile = {
        id: file.id,
        name: file.file_name,
        size: file.size || 0,
        type: "Excel" as const,
        uploadDate: file.created_time.toDate(),
        uploadedBy: {
          id: file.uploaded_by?.id || "unknown",
          name: file.uploaded_by?.name || "Unknown User",
          email: file.uploaded_by?.email || "unknown@example.com",
        },
        icon: "📄",
        status: "Procesado" as const,
        processedData,
        file: new File([], file.file_name),
      };

      console.log("Transformed file object:", transformedFile);

      sessionStorage.setItem(`selectedFile_${file.id}`, JSON.stringify(transformedFile));
      console.log(`Saved transformed file to sessionStorage with key selectedFile_${file.id}`);

      router.push(`/dashboard/file/${file.id}?from=excel-export`);
      console.log(`Navigated to /dashboard/file/${file.id}?from=excel-export`);
    } catch (error) {
      console.error("Error handling file details:", error);
      toast({ title: "Error", description: "No se pudo cargar la información del archivo.", variant: "destructive" });
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      const file = files.find(f => f.id === fileToDelete);
      if (file) {
        const storage = getStorage();
        // Correctly reference the file in the "uploads/{userId}/{fileName}" path
        const userId = user?.id; // Assuming user object contains the id
        if (!userId) {
            toast({ title: "Error", description: "No se pudo identificar al usuario para la eliminación.", variant: "destructive" });
            return;
        }
        const filePath = `uploads/${userId}/${file.file_name}`;
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }
      
      await deleteDoc(doc(db, "processed_files", fileToDelete));
      
      setFiles(files.filter(f => f.id !== fileToDelete));
      toast({ title: "Éxito", description: "Archivo eliminado correctamente." });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({ title: "Error", description: "No se pudo eliminar el archivo.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  useEffect(() => {
    const fetchFiles = async () => {
      setLoadingFiles(true);
      try {
        const startDate = new Date(selectedYear, selectedMonth, 1);
        const endDate = new Date(selectedYear, selectedMonth + 1, 1);

        const q = query(
          collection(db, "processed_files"),
          where("created_time", ">=", Timestamp.fromDate(startDate)),
          where("created_time", "<", Timestamp.fromDate(endDate))
        );

        const querySnapshot = await getDocs(q);
        const fetchedFiles: ProcessedFile[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const processedData = {
            general_data: {
              file_name: data.file_name,
              supplier: data.supplier,
              month: data.month,
            },
            promotions: {
              products: data.products || [],
              combos: data.combos || [],
            },
          };
          console.log("Processed data constructed:", processedData);
          fetchedFiles.push({ 
            id: doc.id, 
            file_name: data.file_name,
            created_time: data.created_time,
            uploaded_by: data.uploaded_by,
            processedData,
          } as ProcessedFile);
        });
        console.log("Fetched files:", fetchedFiles);
        setFiles(fetchedFiles);
      } catch (error) {
        console.error("Error fetching processed files:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los archivos procesados.",
          variant: "destructive",
        });
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchFiles();
  }, [selectedMonth, selectedYear, toast]);

  const handleGenerateExcel = async (range?: DateRange) => {
    const targetRange = range || date;

    if (!targetRange?.from || !targetRange?.to) {
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

    const startDate = formatDate(targetRange.from);
    const endDate = formatDate(targetRange.to);

    toast({
      title: "Procesamiento iniciado",
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

             // Dynamically import xlsx only when needed (client-side)
       const XLSX = await import("xlsx");
       const workbook = XLSX.utils.book_new();

       // Generate simple view
       const headers = Array.from(
         rows.reduce<Set<string>>((set, row) => {
           Object.keys(row ?? {}).forEach((k) => set.add(k));
           return set;
         }, new Set<string>())
       );

       const worksheetData = [
         headers,
         ...rows.map(row => headers.map(h => row[h] ?? ""))
       ];

       const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
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

      toast({ title: "Exportación completa", description: `Datos exportados: ${fileName}` });
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

      toast({ title: "Error al procesar", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Gestionar Datos
          </h1>
      </div>
       <Card>
            <CardHeader>
                <CardTitle>Gestionar Reportes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                <div className="grid gap-2">
                    <DateRangePicker date={date} onDateChange={setDate} />
                    <p className="text-sm text-muted-foreground">
                        Seleccione el rango de fechas para gestionar los datos.
                    </p>
                </div>
                                 <Button onClick={() => handleGenerateExcel()} className="w-full sm:w-auto">
                     <Download className="mr-2 h-4 w-4" />
                     Exportar Datos
                 </Button>
            </CardContent>
        </Card>

        <Card>
                         <CardHeader>
                 <CardTitle>Datos Procesados del Mes</CardTitle>
                <div className="flex items-center gap-4 pt-2">
                    <Select
                        value={String(selectedMonth)}
                        onValueChange={(value) => setSelectedMonth(Number(value))}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar Mes" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i} value={String(i)}>
                                    {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={String(selectedYear)}
                        onValueChange={(value) => setSelectedYear(Number(value))}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Seleccionar Año" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <SelectItem key={year} value={String(year)}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre del Archivo</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Fecha de Creación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingFiles ? (
                            <TableRow>
                                <TableCell colSpan={4}>Cargando archivos...</TableCell>
                            </TableRow>
                        ) : files.length > 0 ? (
                            files.map((file) => (
                                <TableRow key={file.id}>
                                    <TableCell>{file.file_name}</TableCell>
                                    <TableCell>{file.uploaded_by?.name || 'N/A'}</TableCell>
                                    <TableCell>
                                        {file.created_time.toDate().toLocaleString('es-ES')}
                                    </TableCell>
                                                                         <TableCell className="text-right">
                                         <div className="flex items-center justify-end gap-2">
                                             <Button
                                                 variant="ghost"
                                                 size="icon"
                                                 onClick={() => handleViewClick(file)}
                                             >
                                                 <Eye className="h-4 w-4" />
                                                 <span className="sr-only">Ver</span>
                                             </Button>
                                             {isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setFileToDelete(file.id);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Eliminar</span>
                                                </Button>
                                             )}
                                             <Button
                                                 variant="ghost"
                                                 size="icon"
                                                 onClick={() => handleGenerateExcel({
                                                     from: file.created_time.toDate(),
                                                     to: file.created_time.toDate()
                                                 })}
                                             >
                                                 <Download className="h-4 w-4" />
                                             </Button>
                                         </div>
                                     </TableCell>
                                </TableRow>
                            ))
                                                 ) : (
                             <TableRow>
                                 <TableCell colSpan={4}>No se encontraron datos para el mes seleccionado.</TableCell>
                             </TableRow>
                         )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente el archivo y sus datos asociados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteFile}
                    >
                        Continuar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
