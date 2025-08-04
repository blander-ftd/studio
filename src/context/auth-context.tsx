
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type Role = 'Admin' | 'Usuario' | 'Proveedor';

interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
  status?: 'Active' | 'Inactive' | 'Pending';
}

interface AuthContextType {
  user: User;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultUser: User = {
    id: 'anonymous',
    name: 'Guest User',
    email: '',
    role: 'Proveedor', 
    status: 'Pending',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser && firebaseUser.email) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({
                    id: firebaseUser.uid,
                    name: userData.name || firebaseUser.displayName || 'User',
                    email: firebaseUser.email,
                    role: userData.role || 'Proveedor',
                    status: userData.status ? 'Active' : 'Inactive',
                });
            } else {
                 // Fallback for users that exist in Auth but not in 'users' collection
                 // This could be a newly approved user, or a test user
                setUser({
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email,
                    role: 'Proveedor',
                    status: 'Active'
                });
            }
        } else {
            setUser(defaultUser);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const value = { user, loading, setUser };

  return <AuthContext.Provider value={value}>{loading ? <div>Loading...</div> : children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
