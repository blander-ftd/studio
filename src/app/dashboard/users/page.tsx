
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
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc, setDoc, deleteDoc, addDoc } from "firebase/firestore";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const isAdmin = currentUser.role === 'Admin';

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
    });

    const unsubPendingUsers = onSnapshot(collection(db, "pending_users"), (snapshot) => {
        const pendingUsersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setPendingUsers(pendingUsersData);
    });

    return () => {
        unsubUsers();
        unsubPendingUsers();
    };
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleDeleteUser = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
  };

  const handleSaveUser = async (user: User) => {
    if (editingUser && user.id) {
      // Edit existing user in 'users' collection
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, user, { merge: true });
    } else {
      // Add new user to 'pending_users' collection
      await addDoc(collection(db, "pending_users"), { ...user, status: 'Pending' });
    }
    setIsFormOpen(false);
    setEditingUser(null);
  };
  
  const handleApproveUser = async (user: User) => {
    if(!user.id) return;
    const pendingUserRef = doc(db, "pending_users", user.id);
    const pendingUserSnap = await getDoc(pendingUserRef);

    if (pendingUserSnap.exists()) {
        const userData = pendingUserSnap.data();
        await setDoc(doc(db, "users", user.id), { ...userData, status: 'Active' });
        await deleteDoc(pendingUserRef);
    }
  };

  const handleRejectUser = async (userId: string) => {
    await deleteDoc(doc(db, "pending_users", userId));
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
