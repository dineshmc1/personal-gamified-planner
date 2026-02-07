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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

        // TODO: Update Google Calendar here

        return NextResponse.json({ status: 'success', updatedFields: updates });
    } catch (error) {
        console.error("Task Update Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

        await taskRef.delete();

        // TODO: Delete form Google Calendar here

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error("Task Delete Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
