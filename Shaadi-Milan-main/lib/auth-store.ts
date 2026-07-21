'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  onAuthStateChanged,
  Unsubscribe
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { AdminUser } from '@/types';

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuthState: () => Unsubscribe;
}

const fetchUserData = async (firebaseUser: FirebaseUser): Promise<AdminUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));

    // ❌ If NOT in admins → reject
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();

    // ❌ Extra safety: check role
    if (userData.role !== 'admin') {
      return null;
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: userData.name || firebaseUser.displayName || '',
      role: userData.role,
    };

  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        // Input validation
        if (!email || !password) {
          return { 
            success: false, 
            error: 'Please enter both email and password.' 
          };
        }

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();

        try {
          const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
          const firebaseUser = userCredential.user;
          
          const userData = await fetchUserData(firebaseUser);
          
          if (!userData) {
            await signOut(auth);
            return { 
              success: false, 
              error: 'Access denied. You are not authorized.' 
            };
          }
          
          set({ user: userData, isAuthenticated: true });
          return { success: true };
          
        } catch (error: any) {
          console.error('Login error code:', error.code);
          console.error('Login error message:', error.message);
          
          // IMPORTANT: Return user-friendly message for wrong credentials
          // This catches BOTH wrong email AND wrong password
          if (error.code === 'auth/invalid-credential' || 
              error.code === 'auth/user-not-found' || 
              error.code === 'auth/wrong-password') {
            return { 
              success: false, 
              error: 'Invalid email or password. Please try again.' 
            };
          }
          
          // Handle other errors
          let errorMessage = 'Login failed. Please try again.';
          switch (error.code) {
            case 'auth/invalid-email':
              errorMessage = 'Please enter a valid email address.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'This account has been disabled.';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many failed attempts. Please try again later.';
              break;
            case 'auth/network-request-failed':
              errorMessage = 'Network error. Please check your connection.';
              break;
            default:
              errorMessage = 'Invalid email or password. Please try again.';
          }
          
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      checkAuthState: () => {
        set({ isLoading: true });
        
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const userData = await fetchUserData(firebaseUser);
            if (userData) {
              set({ user: userData, isAuthenticated: true, isLoading: false });
            } else {
              await signOut(auth);
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        });
        
        return unsubscribe;
      },
    }),
    {
      name: 'arvika-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);