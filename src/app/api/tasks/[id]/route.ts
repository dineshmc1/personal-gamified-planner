import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { TaskSchema } from '@/lib/schemas';
import { Timestamp } from 'firebase-admin/firestore';

// Helper to validate auth and get user ID
async function getAuthenticatedUid(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await getAuth(getAdminApp()).verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (e) {
        return null;
    }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const uid = await getAuthenticatedUid(req);
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = params;
        const body = await req.json();

        // Partial validation for updates
        const result = TaskSchema.partial().safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error.flatten() }, { status: 400 });
        }

        const taskRef = adminDb.collection('tasks').doc(id);
        const taskSnap = await taskRef.get();

        if (!taskSnap.exists) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        if (taskSnap.data()?.userId !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updates: any = { ...result.data };
        // Convert strings back to Timestamps if present
        if (updates.scheduledStart) updates.scheduledStart = Timestamp.fromDate(new Date(updates.scheduledStart));
        if (updates.scheduledEnd) updates.scheduledEnd = Timestamp.fromDate(new Date(updates.scheduledEnd));

        await taskRef.update(updates);

        // Sync Update to Google Calendar
        const currentData = taskSnap.data();
        if (currentData?.calendarEventId) {
            try {
                // We need to fetch the calendar sync helper
                // This dynamic import avoids circular deps usually, but here just keeps cold start fast
                const { getGoogleCalendarClient } = await import('@/lib/google-calendar');
                const calendar = await getGoogleCalendarClient(uid);

                if (calendar) {
                    // Construct patch body
                    const patchBody: any = {};
                    if (updates.title) patchBody.summary = `[${(updates.category || currentData.category).toUpperCase()}] ${updates.title}`;
                    if (updates.description !== undefined) patchBody.description = updates.description;
                    if (updates.scheduledStart) patchBody.start = { dateTime: updates.scheduledStart.toDate().toISOString() };
                    if (updates.scheduledEnd) patchBody.end = { dateTime: updates.scheduledEnd.toDate().toISOString() };

                    await calendar.events.patch({
                        calendarId: 'primary',
                        eventId: currentData.calendarEventId,
                        requestBody: patchBody
                    });
                }
            } catch (e) {
                console.error("Calendar Update Sync Failed", e);
            }
        }

        return NextResponse.json({ status: 'success', updatedFields: updates });
    } catch (error) {
        console.error("Task Update Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const uid = await getAuthenticatedUid(req);
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = params;
        const taskRef = adminDb.collection('tasks').doc(id);
        const taskSnap = await taskRef.get();

        if (!taskSnap.exists) {
            // Idempotent success if already gone
            return NextResponse.json({ status: 'success' });
        }

        if (taskSnap.data()?.userId !== uid) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const taskData = taskSnap.data();

        await taskRef.delete();

        // Sync Delete to Google Calendar
        if (taskData?.calendarEventId) {
            try {
                const { getGoogleCalendarClient } = await import('@/lib/google-calendar');
                const calendar = await getGoogleCalendarClient(uid);
                if (calendar) {
                    await calendar.events.delete({
                        calendarId: 'primary',
                        eventId: taskData.calendarEventId
                    });
                }
            } catch (e) {
                console.error("Calendar Delete Sync Failed", e);
            }
        }

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error("Task Delete Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
