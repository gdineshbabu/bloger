/* eslint-disable @typescript-eslint/no-explicit-any */

import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteParams {
    params: {
        siteId: string;
    };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];
        const { siteId } = params;

        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { uid } = await verifyAuthToken(token);
        const siteRef = dbAdmin.collection('sites').doc(siteId);
        const siteDoc = await siteRef.get();

        if (!siteDoc.exists) return NextResponse.json({ message: 'Site not found' }, { status: 404 });

        const siteData = siteDoc.data();
        if (siteData?.ownerId !== uid) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        return NextResponse.json({ id: siteDoc.id, ...siteData });
    } catch (error) {
        console.error(`Error fetching site ${params.siteId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];
        const { siteId } = params;

        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { uid } = await verifyAuthToken(token);
        const { content, pageStyles } = await request.json();

        if (!content || !pageStyles) return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });

        const siteRef = dbAdmin.collection('sites').doc(siteId);
        const siteDoc = await siteRef.get();

        if (!siteDoc.exists) return NextResponse.json({ message: 'Site not found' }, { status: 404 });

        if (siteDoc.data()?.ownerId !== uid) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        await siteRef.update({
            draftContent: content, 
            draftPageStyles: pageStyles,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ message: 'Draft updated successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Error updating site ${params.siteId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];
        const { siteId } = params;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { uid } = await verifyAuthToken(token);
        const { title, isFavourite, status } = await request.json();

        if (!siteId) {
            return NextResponse.json({ message: 'Site ID is missing' }, { status: 400 });
        }

        if (title === undefined && isFavourite === undefined && status === undefined) {
             return NextResponse.json({ message: 'Missing fields to update (title, isFavourite, or status)' }, { status: 400 });
        }

        const siteRef = dbAdmin.collection('sites').doc(siteId);
        const siteDoc = await siteRef.get();

        if (!siteDoc.exists) {
            return NextResponse.json({ message: 'Site not found' }, { status: 404 });
        }

        const siteData = siteDoc.data();
        if (siteData?.ownerId !== uid) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
        
        const updateData: { [key: string]: any } = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (title !== undefined) {
            if (typeof title !== 'string' || title.trim().length === 0) {
                return NextResponse.json({ message: 'Invalid title' }, { status: 400 });
            }
            updateData.title = title.trim();
        }

        if (isFavourite !== undefined) {
             if (typeof isFavourite !== 'boolean') {
                return NextResponse.json({ message: 'Invalid isFavourite value' }, { status: 400 });
            }
            updateData.isFavourite = isFavourite;
        }

        if (status !== undefined) {
            if (typeof status !== 'string' || (status !== 'published' && status !== 'draft')) {
                return NextResponse.json({ message: 'Invalid status value. Must be "published" or "draft".' }, { status: 400 });
            }
            updateData.status = status;

            if (status === 'published') {
                updateData.lastPublishedAt = FieldValue.serverTimestamp();
            }
        }

        await siteRef.update(updateData);
        
        const updatedSiteDoc = await siteRef.get();
        const updatedSite = {
            id: updatedSiteDoc.id,
            ...updatedSiteDoc.data()
        };

        return NextResponse.json(updatedSite, { status: 200 });

    } catch (error) {
        console.error('Error updating site (PATCH):', error);
        if (error instanceof Error && error.message.includes('token')) {
             return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];
        const { siteId } = params;

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { uid } = await verifyAuthToken(token);

        if (!siteId) {
            return NextResponse.json({ message: 'Site ID is missing' }, { status: 400 });
        }

        const siteRef = dbAdmin.collection('sites').doc(siteId);
        const userRef = dbAdmin.collection('users').doc(uid);

        const siteDoc = await siteRef.get();

        if (!siteDoc.exists) {
            return NextResponse.json({ message: 'Site not found' }, { status: 404 });
        }

        const siteData = siteDoc.data();
        if (siteData?.ownerId !== uid) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        await dbAdmin.runTransaction(async (transaction) => {
            transaction.delete(siteRef);
            transaction.update(userRef, {
                totalSites: FieldValue.increment(-1)
            });
        });
        
        return NextResponse.json({ message: 'Site deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error(`Error deleting site ${params.siteId}:`, error);
        if (error instanceof Error && error.message.includes('token')) {
             return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
