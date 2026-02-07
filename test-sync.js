const fetch = require('node-fetch'); // Assuming node-fetch or native fetch in Node 18+

async function testSync() {
    try {
        // We can't easily get a valid ID token without a real login, 
        // but we can check if the server returns 401 (meaning code ran and hit auth check)
        // vs 500 (Build Error).

        console.log("Testing POST /api/auth/sync...");
        const res = await fetch('http://localhost:3000/api/auth/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Invalid token, should return 401 if code compiles
                'Authorization': 'Bearer invalid-token'
            },
            body: JSON.stringify({
                accessToken: 'mock-access-token'
            })
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 200)}...`);

        if (res.status === 500) {
            console.error("FAIL: Server Error (likely build failed)");
        } else if (res.status === 401) {
            console.log("SUCCESS: Code executed (Auth check passed/failed correctly)");
        } else {
            console.log("Unknown status, but likely not a build error.");
        }

    } catch (e) {
        console.error("Connection Failed:", e.message);
    }
}

testSync();
