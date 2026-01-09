'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserGroup {
  id: string;
  name: string;
  createdAt: number;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  groupId?: string;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  groups: UserGroup[];
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  addGroup: (name: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<UserGroup[]>([]);

  const fetchGroups = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'groups'));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserGroup));
      // 클라이언트에서 정렬
      data.sort((a, b) => a.createdAt - b.createdAt);
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const addGroup = async (name: string) => {
    try {
      const id = Date.now().toString();
      const newGroup: UserGroup = { id, name, createdAt: Date.now() };
      await setDoc(doc(db, 'groups', id), newGroup);
      // 함수형 업데이트로 최신 상태 보장
      setGroups(prev => [...prev, newGroup]);
    } catch (error) {
      console.error('Error adding group:', error);
      throw error;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'groups', id));
      // 함수형 업데이트로 최신 상태 보장
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  };

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

        // 그룹 목록 가져오기
        fetchGroups();
      } else {
        setAppUser(null);
        setGroups([]);
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
    <AuthContext.Provider value={{ user, appUser, loading, groups, signInWithGoogle, logout, fetchGroups, addGroup, deleteGroup }}>
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
