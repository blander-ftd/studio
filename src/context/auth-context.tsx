
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'Admin' | 'Usuario' | 'Proveedor';

interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
  status?: 'Active' | 'Pending';
}

interface AuthContextType {
  user: User;
  setUserRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialUser: User = {
    id: '1',
    name: 'John Pilot',
    email: 'john@filecatalyst.com',
    role: 'Admin',
    status: 'Active',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(initialUser);

  const setUserRole = (role: Role) => {
    setUser(prevUser => ({ ...prevUser, role }));
  };
  
  const value = { user, setUserRole };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
