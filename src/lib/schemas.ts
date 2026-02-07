import { z } from 'zod';

export const TaskSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().optional(),
    category: z.enum(["study", "gym", "work", "life", "health"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    scheduledStart: z.string().datetime(), // ISO string from frontend
    scheduledEnd: z.string().datetime(),
    // XP/Stats are calculated server-side, not passed from client
});

export type TaskInput = z.infer<typeof TaskSchema>;
