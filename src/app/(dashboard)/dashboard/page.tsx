'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center text-emerald-500 font-mono">LOADING SYSTEM...</div>;
    }

    const handleModeSwitch = async (mode: string) => {
        try {
            const token = await user.getIdToken();
            await fetch('/api/user/mode', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ mode })
            });
            // Optimistic update or refetch would go here
            alert(`Switched to ${mode.toUpperCase()} mode`);
        } catch (e) {
            console.error(e);
            alert('Failed to switch mode');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 p-8">
            <header className="flex items-center justify-between border-b border-neutral-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white font-mono">COMMAND CENTER</h1>
                    <p className="text-neutral-400">Welcome back, {user.displayName}</p>
                </div>
                <button
                    onClick={logout}
                    className="rounded border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm text-red-400 hover:bg-red-900/40 transition-colors"
                >
                    LOGOUT
                </button>
            </header>

            <main className="mt-8 grid gap-6 md:grid-cols-3">
                {/* Placeholder for Stats */}
                <div className="col-span-1 border border-neutral-800 bg-neutral-900/50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold text-neutral-300 mb-4 font-mono">STATS</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>INT</span> <span className="text-blue-400">0</span></div>
                        <div className="flex justify-between"><span>STR</span> <span className="text-red-400">0</span></div>
                        <div className="flex justify-between"><span>DIS</span> <span className="text-yellow-400">0</span></div>
                    </div>
                </div>

                {/* Tasks and Modes */}
                <div className="col-span-2 space-y-6">
                    <div className="border border-neutral-800 bg-neutral-900/50 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-neutral-300 font-mono">CURRENT MODE</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {['monk', 'beast', 'recovery'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => handleModeSwitch(m)}
                                    className="p-2 border border-neutral-700 hover:border-emerald-500 rounded text-sm text-neutral-400 uppercase transition-colors hover:text-emerald-400"
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border border-neutral-800 bg-neutral-900/50 p-6 rounded-lg">
                        <h3 className="text-lg font-bold text-neutral-300 mb-4 font-mono">TODAY'S MISSIONS</h3>
                        <p className="text-neutral-500 italic">No missions detected.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
