import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';

// In Next.js 15, params is a Promise.
type ParamsType = Promise<{ siteId: string; versionId: string }>;

export async function GET(request: NextRequest, { params }: { params: ParamsType }) {
    // Await params first
    const { siteId, versionId } = await params;

    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        if (!siteId || !versionId) {
            return NextResponse.json(
                { message: 'Missing siteId or versionId' },
                { status: 400 }
            );
        }

        const { uid } = await verifyAuthToken(token);

        const siteRef = dbAdmin.collection('sites').doc(siteId);
        const siteSnap = await siteRef.get();

        if (!siteSnap.exists || siteSnap.data()?.ownerId !== uid) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const versionRef = siteRef.collection('history').doc(versionId);
        const versionSnap = await versionRef.get();

        if (!versionSnap.exists) {
            return NextResponse.json({ message: 'Version not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: versionSnap.id,
            ...versionSnap.data(),
        });

    } catch (error: unknown) {
        const err = error as { code?: string; message?: string };

        console.error(
            `Error fetching version ${versionId} for site ${siteId}:`,
            err
        );

        if (
            err.code === 'auth/id-token-expired' ||
            err.code === 'auth/argument-error'
        ) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { message: 'Internal Server Error', details: err.message ?? 'Unknown error' },
            { status: 500 }
        );
    }
}