import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: {
        siteId: string;
        versionId: string;
    };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];
    const { siteId, versionId } = params;

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
    const siteDoc = await siteRef.get();

    if (!siteDoc.exists || siteDoc.data()?.ownerId !== uid) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const versionRef = siteRef.collection('history').doc(versionId);
    const versionSnap = await versionRef.get();

    if (!versionSnap.exists) {
      return NextResponse.json({ message: 'Version not found' }, { status: 404 });
    }

    const versionData = versionSnap.data();

    return NextResponse.json({
        id: versionSnap.id,
        ...versionData,
    });

  } catch (error: any) {
    console.error(`Error fetching version ${params.versionId} for site ${params.siteId}:`, error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { message: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}