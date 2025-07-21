"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileCatalystLogo } from "@/components/icons"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="mx-auto max-w-sm w-full shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <FileCatalystLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">Portal de Aliados Comerciales</CardTitle>
          </div>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="pt-2">
              <Link href="/dashboard" className="w-full">
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Ingresar
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center text-sm">
            No tienes Cuenta?{" "}
            <Link href="#" className="underline text-primary">
              Crear
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
