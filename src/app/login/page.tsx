'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && !loading) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-4">
            <div className="w-full max-w-md space-y-8 rounded-lg border border-neutral-800 bg-neutral-900 p-10 text-center shadow-lg">
                <div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
                        Enter the System
                    </h2>
                    <p className="mt-2 text-sm text-neutral-400">
                        Gamified planning for the focused individual.
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <button
                        onClick={signInWithGoogle}
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 transition-all font-mono tracking-wide"
                    >
                        {loading ? 'INITIALIZING...' : 'CONNECT GOOGLE ACCOUNT'}
                    </button>
                </div>
            </div>
        </div>
    );
}
