import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const secretsSnap = await adminDb.collection('user_secrets').get();
        const results = secretsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                hasAccessToken: !!data.googleAccessToken,
                hasRefreshToken: !!data.refreshToken,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            };
        });

        return NextResponse.json({
            count: results.length,
            users: results
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
