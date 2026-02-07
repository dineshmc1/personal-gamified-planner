import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { TaskSchema } from '@/lib/schemas';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const adminAuth = getAuth(getAdminApp());
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        const body = await req.json();
        const result = TaskSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.flatten() }, { status: 400 });
        }

        const { title, description, category, difficulty, scheduledStart, scheduledEnd } = result.data;

        // TODO: Calculate XP Reward Server-Side based on difficulty/category
        const baseXp = { easy: 10, medium: 20, hard: 40 };
        const xpReward = baseXp[difficulty];

        const newTask = {
            userId: uid,
            title,
            description: description || '',
            category,
            difficulty,
            status: 'pending',
            scheduledStart: Timestamp.fromDate(new Date(scheduledStart)),
            scheduledEnd: Timestamp.fromDate(new Date(scheduledEnd)),
            xpReward,
            statReward: { type: 'intelligence', amount: 1 }, // TODO: Dynamic mapping
            createdAt: Timestamp.now(),
        };

        const docRef = await adminDb.collection('tasks').add(newTask);

        // Sync to Google Calendar
        try {
            const { getGoogleCalendarClient } = await import('@/lib/google-calendar');
            const calendar = await getGoogleCalendarClient(uid);

            if (calendar) {
                const event = await calendar.events.insert({
                    calendarId: 'primary',
                    requestBody: {
                        summary: `[${newTask.category.toUpperCase()}] ${newTask.title}`,
                        description: newTask.description,
                        start: { dateTime: newTask.scheduledStart.toDate().toISOString() },
                        end: { dateTime: newTask.scheduledEnd.toDate().toISOString() },
                        extendedProperties: {
                            private: {
                                app: 'gamified-planner',
                                taskId: docRef.id
                            }
                        }
                    }
                });

                if (event.data.id) {
                    await docRef.update({ calendarEventId: event.data.id });
                }
            }
        } catch (calendarError) {
            console.error("Calendar Sync Failed:", calendarError);
            // We do NOT fail the request, just log it. Task is still created.
        }

        return NextResponse.json({ status: 'success', taskId: docRef.id, task: newTask });

    } catch (error) {
        console.error('Task Creation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
