import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { calculateTaskXP, getUpdatedStats, calculateLevel, calculateXpForNextLevel } from '@/lib/gamification';
import { Task, UserProfile } from '@/types';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const idToken = authHeader.split('Bearer ')[1];

    try {
        const adminAuth = getAuth(getAdminApp());
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const { id } = params;

        // 1. Transaction to ensure atomicity of XP/Stats/Task update
        try {
            const result = await adminDb.runTransaction(async (t) => {
                const taskRef = adminDb.collection('tasks').doc(id);
                const userRef = adminDb.collection('users').doc(uid);

                const taskDoc = await t.get(taskRef);
                const userDoc = await t.get(userRef);

                if (!taskDoc.exists) throw new Error("Task not found");
                if (!userDoc.exists) throw new Error("User not found");

                const taskData = taskDoc.data() as Task;
                const userData = userDoc.data() as UserProfile;

                if (taskData.userId !== uid) throw new Error("Forbidden");
                if (taskData.status === 'completed') throw new Error("Task already completed");

                // 2. Calculate Rewards
                const xpGained = calculateTaskXP(taskData, userData.mode);
                const newStats = getUpdatedStats(userData.stats, taskData.category);
                let newXp = userData.currentXp + xpGained;
                let newLevel = userData.level;
                let nextLevelXp = userData.nextLevelXp;

                // Level Up Logic
                if (newXp >= nextLevelXp) {
                    newLevel++;
                    nextLevelXp = calculateXpForNextLevel(newLevel);
                    // Can add level-up bonus or notification flag here
                }

                // 3. Update Task
                t.update(taskRef, {
                    status: 'completed',
                    completedAt: Timestamp.now(), // Add this field to schema implicitly or explicitly
                });

                // 4. Update User
                t.update(userRef, {
                    currentXp: newXp,
                    level: newLevel,
                    nextLevelXp: nextLevelXp,
                    stats: newStats,
                    // currency: FieldValue.increment(10) // Example
                });

                return { xpGained, newLevel, newStats };
            });

            return NextResponse.json({ status: 'success', rewards: result });

        } catch (e: any) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }

    } catch (error) {
        console.error("Task Complete Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
