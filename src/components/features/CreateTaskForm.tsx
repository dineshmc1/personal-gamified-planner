'use client';

import { useState } from "react";
import { Button, Input, Select } from "../ui/primitives";
import { Plus } from "lucide-react";
import { TaskInput } from "@/lib/schemas";

interface CreateTaskFormProps {
    onCreate: (data: TaskInput) => Promise<void>;
}

export function CreateTaskForm({ onCreate }: CreateTaskFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<TaskInput>>({
        difficulty: "medium",
        category: "work",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);


        try {
            if (!formData.scheduledStart || !formData.scheduledEnd) {
                alert("Time is an illusion, but deadlines are real. Set them.");
                setLoading(false);
                return;
            }

            await onCreate({
                title: formData.title!,
                description: formData.description || "",
                category: formData.category as any,
                difficulty: formData.difficulty as any,
                scheduledStart: formData.scheduledStart!,
                scheduledEnd: formData.scheduledEnd!
            });
            setIsOpen(false);
            setFormData({ difficulty: "medium", category: "work", title: "" }); // Reset
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} className="w-full border-dashed border-2 border-neutral-800 bg-transparent hover:bg-neutral-900 hover:border-neutral-700 text-neutral-500 mb-4 h-12">
                <Plus size={16} className="mr-2" /> Add New Mission
            </Button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-lg border border-neutral-800 bg-neutral-900/30 space-y-4">
            <Input
                placeholder="Mission Title"
                value={formData.title || ""}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                autoFocus
            />

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-xs text-neutral-500 font-mono">START</label>

                    <label className="text-xs text-neutral-500 font-mono">START</label>
                    <Input
                        type="datetime-local"
                        value={formData.scheduledStart || ""}
                        required
                        onChange={e => {
                            setFormData({ ...formData, scheduledStart: e.target.value });
                        }}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-neutral-500 font-mono">END</label>
                    <Input
                        type="datetime-local"
                        value={formData.scheduledEnd || ""}
                        required
                        onChange={e => {
                            setFormData({ ...formData, scheduledEnd: e.target.value });
                        }}
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <Select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                >
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="gym">Gym</option>
                    <option value="health">Health</option>
                    <option value="life">Life</option>
                </Select>

                <Select
                    value={formData.difficulty}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
                >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </Select>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Deploying...' : 'Deploy Mission'}</Button>
            </div>
        </form>
    );
}
