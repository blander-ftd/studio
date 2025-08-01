
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X } from "lucide-react";
import { UserForm, User } from "@/components/user-form";
import { useAuth } from "@/context/auth-context";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const isAdmin = currentUser.role === 'Admin';

  useEffect(() => {
    // Mock data, as we are avoiding direct Firestore calls from the client.
    const mockUsers: User[] = [
      { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin', status: 'Active' },
      { id: '2', name: 'Regular User', email: 'user@example.com', role: 'Usuario', status: 'Active' },
      { id: '3', name: 'Provider User', email: 'provider@example.com', role: 'Proveedor', status: 'Active' },
    ];
    const mockPendingUsers: User[] = [
        { id: '4', name: 'Pending Admin', email: 'pending.admin@example.com', role: 'Admin', status: 'Pending' },
    ]
    setUsers(mockUsers);
    setPendingUsers(mockPendingUsers);
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleSaveUser = (user: User) => {
    if (editingUser && user.id) {
      // Edit existing user
      setUsers(users.map(u => u.id === user.id ? user : u));
    } else {
      // Add new user to pending
      setPendingUsers([...pendingUsers, { ...user, id: crypto.randomUUID(), status: 'Pending' }]);
    }
    setIsFormOpen(false);
    setEditingUser(null);
  };
  
  const handleApproveUser = (user: User) => {
    if(!user.id) return;
    setUsers([...users, { ...user, status: 'Active' }]);
    setPendingUsers(pendingUsers.filter(u => u.id !== user.id));
  };

  const handleRejectUser = (userId: string) => {
    setPendingUsers(pendingUsers.filter(u => u.id !== userId));
  };


  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Usuarios
          </h1>
          {isAdmin && <Button onClick={handleAddUser}>Agregar Usuario</Button>}
        </div>

        {isAdmin && pendingUsers.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Usuarios Pendientes de Aprobación</CardTitle>
                    <CardDescription>Estos usuarios están esperando aprobación para acceder al sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleApproveUser(user)}>
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span className="sr-only">Aprobar</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleRejectUser(user.id!)}>
                                            <X className="h-4 w-4 text-red-500" />
                                            <span className="sr-only">Rechazar</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}

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
                            {isAdmin && (
                                <TableHead>
                                    <span className="sr-only">Acciones</span>
                                </TableHead>
                            )}
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
                                {isAdmin && (
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
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        {isAdmin && <UserForm 
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSave={handleSaveUser}
            user={editingUser}
        />}
    </div>
  )
}
