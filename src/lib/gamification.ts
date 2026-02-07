import { Task, UserProfile } from "@/types";
import { Timestamp } from "firebase-admin/firestore";

export const LEVEL_CURVE_EXPONENT = 1.5;
export const BASE_XP = 100;

export function calculateTaskXP(task: Task, userMode: UserProfile['mode']): number {
    let xp = task.xpReward;

    // 1. Difficulty Multiplier (Already baked into task.xpReward usually, but let's reinforce)
    // Assumes task.xpReward is base.

    // 2. Mode Multiplier
    if (userMode === 'monk') xp *= 1.2;
    if (userMode === 'recovery') xp *= 0.5;
    // beast is 1.0

    // 3. Time Multiplier (Example: Early bird bonus)
    // This would need 'completedAt' vs 'scheduledEnd' logic
    // For MVP, we stick to simpler static multipliers

    return Math.floor(xp);
}

export function calculateLevel(xp: number): number {
    // xp = base * (level ^ exponent)
    // level = (xp / base) ^ (1/exponent)
    return Math.floor(Math.pow(xp / BASE_XP, 1 / LEVEL_CURVE_EXPONENT)) + 1;
}

export function calculateXpForNextLevel(level: number): number {
    return Math.floor(BASE_XP * Math.pow(level, LEVEL_CURVE_EXPONENT));
}

export function getUpdatedStats(

    currentStats: UserProfile['stats'] | undefined,
    category: Task['category']
): UserProfile['stats'] {
    const newStats = {
        intelligence: 0,
        strength: 0,
        discipline: 0,
        balance: 0,
        ...currentStats
    };
    const amount = 1; // Base stat gain per task

    switch (category) {
        case 'study':
            newStats.intelligence += amount;
            break;
        case 'gym':
        case 'health':
            newStats.strength += amount;
            break;
        case 'work':
            newStats.discipline += amount;
            break;
        case 'life':
            newStats.balance += amount;
            break;
    }
    return newStats;
}
