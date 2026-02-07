'use client';

import { Task } from "@/types";
import { Check, Trash2, Clock, Zap } from "lucide-react";
import { Button } from "../ui/primitives";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TaskCardProps {
    task: Task;
    onComplete: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
    const [loading, setLoading] = useState(false);

    const handleComplete = async () => {
        setLoading(true);
        await onComplete(task.id);
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!confirm('Abandon mission?')) return;
        setLoading(true);
        await onDelete(task.id);
        setLoading(false);
    };

    const difficultyColors = {
        easy: "text-green-400 border-green-400/20 bg-green-400/10",
        medium: "text-yellow-400 border-yellow-400/20 bg-yellow-400/10",
        hard: "text-red-400 border-red-400/20 bg-red-400/10",
    };

    return (
        <div className={cn(
            "group relative flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 transition-all hover:bg-neutral-900/80",
            loading && "opacity-50 pointer-events-none"
        )}>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border", difficultyColors[task.difficulty])}>
                        {task.difficulty}
                    </span>
                    <span className="text-xs text-neutral-500 uppercase font-mono tracking-wider">{task.category}</span>
                </div>
                <h4 className="font-medium text-neutral-200">{task.title}</h4>
                {task.description && <p className="text-sm text-neutral-500">{task.description}</p>}
                {/* Scheduled Time Display could go here */}
            </div>

            <div className="flex items-center gap-2">
                <div className="flex flex-col items-end mr-2 text-xs text-neutral-600 font-mono">
                    <div className="flex items-center gap-1 text-emerald-500/70">
                        <Zap size={10} />
                        <span>+{task.xpReward} XP</span>
                    </div>
                </div>

                <Button variant="secondary" onClick={handleDelete} className="h-8 w-8 p-0 text-neutral-500 hover:text-red-400">
                    <Trash2 size={14} />
                </Button>
                <Button variant="primary" onClick={handleComplete} className="h-8 w-8 p-0 bg-emerald-900/20 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20">
                    <Check size={16} />
                </Button>
            </div>
        </div>
    );
}
