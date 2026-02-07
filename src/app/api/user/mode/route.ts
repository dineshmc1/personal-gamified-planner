import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) { // Changed to POST for action
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const adminAuth = getAuth(getAdminApp());
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const { mode } = await req.json();

        if (!['monk', 'recovery', 'beast'].includes(mode)) {
            return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
        }

        await adminDb.collection('users').doc(uid).update({
            mode: mode,
            updatedAt: new Date() // Good practice
        });

        return NextResponse.json({ status: 'success', mode });

    } catch (error) {
        console.error('Mode Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
