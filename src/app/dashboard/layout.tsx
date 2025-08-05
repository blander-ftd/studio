
"use client";

import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { FileCatalystLogo } from "@/components/icons";
import { Sparkles, PanelLeft, Users, ChevronDown, FileSpreadsheet, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FilesProvider } from "@/context/files-context";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

function UserMenu() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
            toast({
                title: "Sesión Cerrada",
                description: "Has cerrado sesión correctamente."
            })
        } catch (error) {
            console.error("Error signing out: ", error);
            toast({
                title: "Error",
                description: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
                variant: "destructive"
            })
        }
    }
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 gap-1">
                    <div className="text-left">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: "/dashboard", icon: Sparkles, label: "Procesador de Archivos", role: ['Admin', 'Usuario', 'Proveedor'] },
    { href: "/dashboard/excel-export", icon: FileSpreadsheet, label: "Exportar a Excel", role: ['Admin', 'Usuario'] },
    { href: "/dashboard/users", icon: Users, label: "Usuarios", role: ['Admin', 'Usuario'] },
  ].filter(item => item.role.includes(user.role));

  return (
    <FilesProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-sidebar text-sidebar-foreground sm:flex">
          <nav className="flex flex-col h-full">
            <div className="flex h-20 items-center border-b border-sidebar-border px-4">
              <Link href="#" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                <FileCatalystLogo className="h-12 w-12" />
                <span className="text-base">Portal de Transfers FARMATODO</span>
              </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <nav className="grid items-start px-4 text-sm font-medium">
                {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                ))}
              </nav>
            </div>
            <div className="mt-auto p-4">
              <div className="flex items-center gap-2">
                 <UserMenu />
              </div>
            </div>
          </nav>
        </aside>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Alternar menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="#"
                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                  >
                    <FileCatalystLogo className="h-8 w-8 transition-all group-hover:scale-110" />
                    <span className="sr-only">Portal de Transfers FARMATODO</span>
                  </Link>
                   {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                          "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                           pathname === item.href ? "text-foreground" : ""
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
          <footer className="text-center text-xs text-muted-foreground p-4">
            En Farmatodo, tu privacidad es nuestra prioridad. Toda la información que compartas con nosotros es "confidencial" y solo la usaremos para los fines de nuestra relación comercial. Nos comprometemos a cuidarla y no compartirla con terceros.
          </footer>
        </div>
      </div>
    </FilesProvider>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </AuthProvider>
    )
}
