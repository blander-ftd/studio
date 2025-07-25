
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { UserForm, User } from "@/components/user-form";

// Mock user data for demonstration
const initialUsers: User[] = [
  {
    id: "1",
    name: "John Pilot",
    email: "john@filecatalyst.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "Editor",
    status: "Active",
  },
  {
    id: "3",
    name: "Sam Wilson",
    email: "sam@example.com",
    role: "Viewer",
    status: "Inactive",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
  };


  const handleSaveUser = (user: User) => {
    if (editingUser) {
      // Edit existing user
      setUsers(users.map((u) => (u.id === user.id ? user : u)));
    } else {
      // Add new user
      setUsers([...users, { ...user, id: crypto.randomUUID(), status: 'Active' }]);
    }
    setIsFormOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Usuarios
          </h1>
          <Button onClick={handleAddUser}>Agregar Usuario</Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Lista de Usuarios</CardTitle>
                <CardDescription>Administre los usuarios de su organización.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>
                                <span className="sr-only">Acciones</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Alternar menú</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleEditUser(user)}>Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteUser(user.id!)}>Eliminar</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <UserForm 
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSaveUser}
            user={editingUser}
        />
    </div>
  )
}
