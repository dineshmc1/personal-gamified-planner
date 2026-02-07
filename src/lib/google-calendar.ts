import { google } from 'googleapis';
import { adminDb } from './firebase-admin';

export async function getGoogleCalendarClient(userId: string) {
    // 1. Fetch user secrets
    const secretSnap = await adminDb.collection('user_secrets').doc(userId).get();

    if (!secretSnap.exists) {
        console.error(`No secrets found for user ${userId}`);
        return null;
    }

    const { googleAccessToken, refreshToken } = secretSnap.data() || {};

    if (!googleAccessToken) {
        console.error(`No access token found for user ${userId}`);
        return null;
    }

    // 2. Initialize OAuth2 Client
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        access_token: googleAccessToken,
        refresh_token: refreshToken, // If we captured it. For MVP, assuming we have valid access token or re-login needed.
    });

    // 3. Return Calendar Client
    return google.calendar({ version: 'v3', auth: oauth2Client });
}
