
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileCatalystLogo } from "@/components/icons"
import { Label } from "@/components/ui/label"
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { UserForm, type User } from "@/components/user-form";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to sign in", error);
      toast({
        title: "Error de autenticación",
        description: "El correo electrónico o la contraseña son incorrectos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    setIsFormOpen(true);
  };

  const handleSaveUser = (user: User) => {
    console.log("New user request:", user);
    toast({
      title: "Solicitud Enviada",
      description: "Su solicitud de registro ha sido enviada para aprobación.",
    });
    setIsFormOpen(false);
  };


  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="mx-auto max-w-sm w-full shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <FileCatalystLogo className="h-24 w-24 text-primary" />
              <CardTitle className="text-3xl font-bold">Portal de Transfers FARMATODO</CardTitle>
            </div>
            <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@ejemplo.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ingresar
                </Button>
              </div>
            </form>
            <div className="mt-4 text-center text-sm">
              No tienes Cuenta?{" "}
              <Button variant="link" className="p-0 h-auto text-primary" onClick={handleSignUp}>
                Crear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <UserForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveUser}
        user={null}
      />
    </>
  )
}
