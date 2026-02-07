import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    level: number;
    currentXp: number;
    nextLevelXp: number;
    stats: {
        intelligence: number;
        strength: number;
        discipline: number;
        balance: number;
    };
    mode: "monk" | "recovery" | "beast"; // Default: "beast"
    currency: number;
}

export interface Task {
    id: string; // Firestore ID
    userId: string;
    title: string;
    description?: string;
    category: "study" | "gym" | "work" | "life" | "health";
    difficulty: "easy" | "medium" | "hard";
    status: "pending" | "completed" | "failed";
    scheduledStart: Timestamp;
    scheduledEnd: Timestamp;
    calendarEventId?: string;
    xpReward: number;
    statReward: { type: string; amount: number };
    createdAt: Timestamp;
}

export interface StoreItem {
    id: string;
    name: string;
    cost: number;
    cooldownHours: number;
    effect?: string;
}
