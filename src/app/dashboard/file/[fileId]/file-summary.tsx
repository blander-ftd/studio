
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Tag, Package } from "lucide-react";

interface Product {
    category: string;
    brand: string;
    [key: string]: any;
}

interface FileSummaryProps {
    products: Product[];
}

export function FileSummary({ products }: FileSummaryProps) {
    if (!products || products.length === 0) {
        return null;
    }

    const totalProducts = products.length;
    const uniqueCategories = new Set(products.map(p => p.category)).size;
    const uniqueBrands = new Set(products.map(p => p.brand)).size;

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Resumen del Procesamiento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted">
                    <Package className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">{totalProducts}</p>
                    <p className="text-sm text-muted-foreground">Productos Totales</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted">
                    <Tag className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">{uniqueCategories}</p>
                    <p className="text-sm text-muted-foreground">Categorías Únicas</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted">
                    <Users className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">{uniqueBrands}</p>
                    <p className="text-sm text-muted-foreground">Marcas Únicas</p>
                </div>
            </CardContent>
        </Card>
    );
}
