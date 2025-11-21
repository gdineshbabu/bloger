import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ siteId: string }> }
) {
    // In Next.js 15, params is a Promise that must be awaited
    const { siteId } = await params;

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        
        const { uid } = await verifyAuthToken(token);
        const siteRef = dbAdmin.collection('sites').doc(siteId);
        const siteDoc = await siteRef.get();

        if (!siteDoc.exists || siteDoc.data()?.ownerId !== uid) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const historySnapshot = await siteRef.collection('history').orderBy('savedAt', 'desc').get();
        const history = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ history });

    } catch (error) {
        console.error(`Error fetching history for site ${siteId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ siteId: string }> }
) {
     // In Next.js 15, params is a Promise that must be awaited
     const { siteId } = await params;

     try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { uid } = await verifyAuthToken(token);
        const { content, pageStyles, versionName } = await request.json();

        if (!content || !pageStyles || !versionName) return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });

        const siteRef = dbAdmin.collection('sites').doc(siteId);
        const siteDoc = await siteRef.get();

        if (!siteDoc.exists || siteDoc.data()?.ownerId !== uid) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const historyRef = siteRef.collection('history').doc();
        await historyRef.set({
            content,
            versionName,
            uid,
            pageStyles,
            savedAt: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ message: 'Version saved successfully', historyId: historyRef.id }, { status: 201 });

    } catch (error) {
        console.error(`Error saving version for site ${siteId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}