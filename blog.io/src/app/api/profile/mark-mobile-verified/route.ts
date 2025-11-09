import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { uid } = await verifyAuthToken(token);

        const userQuery = await dbAdmin.collection('users').where('uid', '==', uid).limit(1).get();
        if (userQuery.empty) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const userDocRef = userQuery.docs[0].ref;

        await userDocRef.update({
            'mobileVerified': true, 
            'verification.mobile.verified': true,
            'updatedAt': FieldValue.serverTimestamp(),
            'verification.mobile.code': FieldValue.delete(), 
            'verification.mobile.expiresAt': FieldValue.delete(), 
        });

        const updatedUserDoc = await userDocRef.get();
        const updatedUserData = updatedUserDoc.data()!;

        const serializeTimestamp = (timestamp: Timestamp | undefined) => {
            if (!timestamp) return undefined;
            return {
                _seconds: timestamp.seconds,
                _nanoseconds: timestamp.nanoseconds,
            };
        };
        
        const serializedUser = {
            ...updatedUserData,
            createdAt: serializeTimestamp(updatedUserData.createdAt),
            updatedAt: serializeTimestamp(updatedUserData.updatedAt),
            verification: {
                ...updatedUserData.verification,
                mobile: {
                    verified: updatedUserData.verification?.mobile?.verified || false,
                }
            },
        };

        return NextResponse.json(serializedUser);

    } catch (error) {
        console.error('Error marking mobile as verified:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}