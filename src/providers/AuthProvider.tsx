'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider } from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
            if (user) {
                // Optional: Trigger a router refresh or redirect if needed
            }
        });

        return () => unsubscribe();
    }, [router]);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential?.accessToken;

            if (result.user) {
                // Sync user to backend and store token securely
                // We do NOT store token in localStorage. We send it immediately to server.
                const idToken = await result.user.getIdToken();

                await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        accessToken: token,
                        // Refresh token usually only comes on first auth or if forced.
                        // verifying user existence is handled by the server.
                    })
                });

                router.push('/dashboard');
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
