
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, ChevronDown, Loader2 } from "lucide-react";
import { UserForm, User } from "@/components/user-form";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

// Helper to map Firestore boolean to string status
const mapStatus = (status: boolean | string | undefined): "Active" | "Inactive" => {
    if (typeof status === 'boolean') {
        return status ? 'Active' : 'Inactive';
    }
    // Default to Inactive if status is missing or not a boolean
    return status === 'Active' ? 'Active' : 'Inactive';
};


export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser.role === 'Admin';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
              id: doc.id, 
              ...data,
              status: mapStatus(data.status)
          } as User
      });
      setUsers(usersList);

      // Temporarily disabling pending users fetch until read access is granted in Firestore rules.
      // To re-enable:
      // 1. Ensure firestore.rules allows read on 'pending_users'.
      // 2. Uncomment the following lines.
      /*
      const pendingUsersCollection = collection(db, "pending_users");
      const pendingUsersSnapshot = await getDocs(pendingUsersCollection);
      const pendingUsersList = pendingUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setPendingUsers(pendingUsersList);
      */

    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de los usuarios. Verifique las reglas de Firestore.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) return;
    try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter(u => u.id !== userId));
        toast({ title: "Éxito", description: "Usuario eliminado correctamente." });
    } catch (error) {
        console.error("Error deleting user: ", error);
        toast({ title: "Error", description: "No se pudo eliminar el usuario.", variant: "destructive" });
    }
  };

  const handleSaveUser = async (user: User) => {
     if (!isAdmin) return;
    if (editingUser && user.id) {
      // Edit existing user
      try {
        const userRef = doc(db, "users", user.id);
        const statusAsBoolean = user.status === 'Active';
        await updateDoc(userRef, { name: user.name, email: user.email, role: user.role, status: statusAsBoolean });
        fetchUsers(); // Refresh data
        toast({ title: "Éxito", description: "Usuario actualizado correctamente." });
      } catch (error) {
        console.error("Error updating user: ", error);
        toast({ title: "Error", description: "No se pudo actualizar el usuario.", variant: "destructive" });
      }
    } else {
      // Add new user (as pending)
      try {
        const newUserRef = doc(collection(db, "pending_users"));
        await setDoc(newUserRef, { ...user, id: newUserRef.id, status: 'Pending' });
        fetchUsers(); // Refresh data
        toast({ title: "Éxito", description: "Solicitud de usuario enviada." });
      } catch (error) {
        console.error("Error creating user request: ", error);
        toast({ title: "Error", description: "No se pudo crear la solicitud de usuario.", variant: "destructive" });
      }
    }
    setIsFormOpen(false);
    setEditingUser(null);
  };
  
  const handleApproveUser = async (user: User) => {
    if(!user.id || !isAdmin) return;
    try {
        await setDoc(doc(db, "users", user.id), { name: user.name, email: user.email, role: user.role, status: true });
        await deleteDoc(doc(db, "pending_users", user.id));
        fetchUsers();
        toast({ title: "Éxito", description: "Usuario aprobado." });
    } catch (error) {
        console.error("Error approving user: ", error);
        toast({ title: "Error", description: "No se pudo aprobar el usuario.", variant: "destructive" });
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!isAdmin) return;
    try {
        await deleteDoc(doc(db, "pending_users", userId));
        setPendingUsers(pendingUsers.filter(u => u.id !== userId));
        toast({ title: "Éxito", description: "Usuario rechazado." });
    } catch (error) {
        console.error("Error rejecting user: ", error);
        toast({ title: "Error", description: "No se pudo rechazar el usuario.", variant: "destructive" });
    }
  };
  
  const handleToggleStatus = async (userId: string) => {
    if (!isAdmin) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const newStatusAsBoolean = newStatus === 'Active';
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { status: newStatusAsBoolean });
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        toast({ title: "Éxito", description: "Estado del usuario actualizado." });
    } catch (error) {
        console.error("Error toggling status: ", error);
        toast({ title: "Error", description: "No se pudo cambiar el estado.", variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId: string, newRole: "Admin" | "Usuario" | "Proveedor") => {
    if (!isAdmin) return;
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { role: newRole });
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast({ title: "Éxito", description: "Rol de usuario actualizado." });
    } catch (error) {
        console.error("Error changing role: ", error);
        toast({ title: "Error", description: "No se pudo cambiar el rol.", variant: "destructive" });
    }
  };
  
  const handlePendingUserRoleChange = async (userId: string, newRole: "Admin" | "Usuario" | "Proveedor") => {
    if (!isAdmin) return;
    try {
        const userRef = doc(db, "pending_users", userId);
        await updateDoc(userRef, { role: newRole });
        setPendingUsers(pendingUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
        console.error("Error changing pending role: ", error);
        toast({ title: "Error", description: "No se pudo cambiar el rol del usuario pendiente.", variant: "destructive" });
    }
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
                                <TableHead>Mensaje</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs truncate">{user.message || "-"}</TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" className="flex items-center gap-2">
                                            {user.role}
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handlePendingUserRoleChange(user.id!, "Admin")}>
                                            Admin
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handlePendingUserRoleChange(user.id!, "Usuario")}>
                                            Usuario
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handlePendingUserRoleChange(user.id!, "Proveedor")}>
                                            Proveedor
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
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
                 {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
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
                                <TableCell>
                                  {isAdmin ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex items-center gap-2">
                                          {user.role}
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id!, "Admin")}>
                                          Admin
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id!, "Usuario")}>
                                          Usuario
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleChange(user.id!, "Proveedor")}>
                                          Proveedor
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : (
                                    user.role
                                  )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant={user.status === 'Active' ? 'default' : 'secondary'}
                                        size="sm"
                                        onClick={() => handleToggleStatus(user.id!)}
                                        disabled={!isAdmin}
                                        className="w-24"
                                    >
                                        {user.status}
                                    </Button>
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
                )}
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

    