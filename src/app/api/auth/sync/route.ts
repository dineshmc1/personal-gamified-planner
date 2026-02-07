import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { UserProfile } from '@/types';

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

        const { accessToken, refreshToken } = await req.json();

        // 1. Check if user exists
        const userRef = adminDb.collection('users').doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            // 2. Create new User Profile
            const newUser: UserProfile = {
                uid,
                email: decodedToken.email || '',
                displayName: decodedToken.name || 'Hero',
                level: 1,
                currentXp: 0,
                nextLevelXp: 100, // Starting XP req
                stats: {
                    intelligence: 0,
                    strength: 0,
                    discipline: 0,
                    balance: 0,
                },
                mode: 'beast',
                currency: 0,
            };

            await userRef.set(newUser);
        }


        // 3. Store Google Access Token securely
        if (accessToken) {
            const secretUpdate: any = {
                googleAccessToken: accessToken,
                updatedAt: new Date(),
            };
            if (refreshToken) {
                secretUpdate.refreshToken = refreshToken;
            }
            await adminDb.collection('user_secrets').doc(uid).set(secretUpdate, { merge: true });
        }

        return NextResponse.json({ status: 'success', user: userSnap.data() || 'created' });

    } catch (error) {
        console.error('Auth Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
