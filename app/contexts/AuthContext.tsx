'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Firestore에서 사용자 정보 가져오기
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (userDoc.exists()) {
          setAppUser(userDoc.data() as AppUser);
        } else {
          // 새 사용자 등록
          const isFirstUser = await checkIfFirstUser();

          const newUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL,
            role: isFirstUser ? 'admin' : 'user',
            status: isFirstUser ? 'approved' : 'pending',
            createdAt: Date.now(),
          };

          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setAppUser(newUser);
        }
      } else {
        setAppUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkIfFirstUser = async (): Promise<boolean> => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.empty;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setAppUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
