
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Tag, Package, Component } from "lucide-react";
import type { ProcessedData } from "@/types";

interface FileSummaryProps {
    processedData: ProcessedData | null;
}

export function FileSummary({ processedData }: FileSummaryProps) {
    if (!processedData) {
        return null;
    }

    const { products = [], combos = [] } = processedData.promotions || {};

    const allProducts = [
      ...products,
      ...combos.flatMap(c => c.products || [])
    ];

    const totalProducts = allProducts.length;
    const uniqueCategories = new Set(allProducts.map(p => p.category)).size;
    const uniqueBrands = new Set(allProducts.map(p => p.brand)).size;
    const totalCombos = combos.length;

    const scrollToCombos = () => {
        const combosSection = document.getElementById("combos-section");
        if (combosSection) {
            combosSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Resumen del Procesamiento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted">
                    <Package className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">{totalProducts}</p>
                    <p className="text-sm text-muted-foreground">Productos Totales</p>
                </div>
                <div 
                    className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted cursor-pointer"
                    onClick={scrollToCombos}
                >
                    <Component className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">{totalCombos}</p>
                    <p className="text-sm text-muted-foreground">Combos Totales</p>
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
