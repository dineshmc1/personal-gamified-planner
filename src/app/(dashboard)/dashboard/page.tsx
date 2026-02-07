'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { UserProfile, Task } from '@/types';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TaskCard } from '@/components/features/TaskCard';
import { CreateTaskForm } from '@/components/features/CreateTaskForm';
import { TaskInput } from '@/lib/schemas';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);

    // 1. Auth Guard
    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    // 2. Real-time User Profile & Task Sync
    useEffect(() => {
        if (!user) return;

        // Listen to Profile
        const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) setProfile(doc.data() as UserProfile);
        });

        // Listen to Tasks (Pending only for now)
        const q = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );


        // Note: requires composite index in FIrestore usually. If error, check console for link.
        const unsubTasks = onSnapshot(q, (snapshot) => {
            setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
        }, (error) => {
            console.error("Firestore Error:", error);
            // This is critical for the user to see the Index creation link
            if (error.code === 'failed-precondition') {
                alert("Firestore Index Required! Check browser console for the link to create it.");
            }
        });

        return () => {
            unsubProfile();
            unsubTasks();
        };
    }, [user]);


    // Actions
    const handleModeSwitch = async (mode: string) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            await fetch('/api/user/mode', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ mode })
            });
        } catch (e) {
            console.error(e);
        }
    };

    const createTask = async (data: TaskInput) => {
        if (!user) return;
        const token = await user.getIdToken();
        try {
            await fetch('/api/tasks/create', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error(e);
            alert('Failed to deploy task');
        }
    };

    const completeTask = async (id: string) => {
        if (!user) return;
        const token = await user.getIdToken();
        try {
            const res = await fetch(`/api/tasks/${id}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.rewards) {
                // Could show toast here
                console.log("Rewards:", json.rewards);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const deleteTask = async (id: string) => {
        if (!user) return;
        const token = await user.getIdToken();
        await fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    };


    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center text-emerald-500 font-mono">Loading System...</div>;
    }

    return (
        <div className="min-h-screen bg-neutral-950 p-6 md:p-12 font-sans selection:bg-emerald-500/30">
            <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Command Center</h1>
                    <div className="flex items-center gap-3 text-neutral-400 mt-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-mono uppercase">Online // Level {profile?.level || 1}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Simple XP Bar */}
                    <div className="flex flex-col w-48">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-neutral-500 mb-1">
                            <span>XP</span>
                            <span>{profile?.currentXp || 0} / {profile?.nextLevelXp || 100}</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                                style={{ width: `${Math.min(100, ((profile?.currentXp || 0) / (profile?.nextLevelXp || 100)) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="text-xs font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest px-3 py-2 hover:bg-red-950/30 rounded transition-all"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="mt-8 grid gap-8 lg:grid-cols-12">
                {/* Left Column: Stats & Modes */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Stats */}
                    <div className="border border-neutral-800 bg-neutral-900/30 p-6 rounded-xl backdrop-blur-sm">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-6">Character Stats</h3>
                        <div className="space-y-4">
                            {Object.entries(profile?.stats || { intelligence: 0, strength: 0, discipline: 0, balance: 0 }).map(([key, val]) => (
                                <div key={key} className="group">
                                    <div className="flex justify-between text-xs font-mono uppercase text-neutral-400 mb-1 group-hover:text-emerald-400 transition-colors">
                                        <span>{key}</span>
                                        <span>{val}</span>
                                    </div>
                                    <div className="h-1 w-full bg-neutral-950 rounded-full overflow-hidden">
                                        <div className={cn("h-full transition-all duration-500",
                                            key === 'intelligence' ? 'bg-blue-500' :
                                                key === 'strength' ? 'bg-red-500' :
                                                    key === 'discipline' ? 'bg-yellow-500' : 'bg-purple-500'
                                        )} style={{ width: `${Math.min(100, val * 2)}%` }} /> {/* Visual scale */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mode Switcher */}
                    <div className="border border-neutral-800 bg-neutral-900/30 p-6 rounded-xl">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">Life Mode</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {['monk', 'beast', 'recovery'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => handleModeSwitch(m)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded border transition-all text-xs font-bold uppercase tracking-wider",
                                        profile?.mode === m
                                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]"
                                            : "border-neutral-800 bg-neutral-950 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                                    )}
                                >
                                    <span>{m}</span>
                                    {profile?.mode === m && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                </button>
                            ))}
                        </div>
                        <p className="mt-4 text-[10px] text-neutral-600 leading-relaxed">
                            {profile?.mode === 'monk' && "High XP. No Store. Pure focus."}
                            {profile?.mode === 'beast' && "Standard XP. Standard Risks."}
                            {profile?.mode === 'recovery' && "Low XP. No Penalties. Heal."}
                        </p>
                    </div>
                </div>

                {/* Right Column: Tasks */}
                <div className="lg:col-span-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Active Missions</h3>
                        <span className="text-xs text-neutral-600 font-mono">{tasks.length} Pending</span>
                    </div>

                    <CreateTaskForm onCreate={createTask} />

                    <div className="space-y-3">
                        {tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onComplete={completeTask}
                                onDelete={deleteTask}
                            />
                        ))}
                    </div>

                    {tasks.length === 0 && (
                        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-lg text-neutral-600">
                            <p className="text-sm font-mono">ALL SYSTEMS NOMINAL. NO ACTIVE MISSIONS.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
