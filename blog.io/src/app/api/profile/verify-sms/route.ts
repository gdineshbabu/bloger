import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const CODE_VALIDITY_DURATION_MS = 10 * 60 * 1000; 

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { uid } = await verifyAuthToken(token);
        const { code } = await request.json();

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ message: 'Verification code is required' }, { status: 400 });
        }

        const userQuery = await dbAdmin.collection('users').where('uid', '==', uid).limit(1).get();
        if (userQuery.empty) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const userDocRef = userQuery.docs[0].ref;
        const userData = userQuery.docs[0].data();
        const verificationData = userData.verification?.mobile;

        if (userData.mobileVerified || verificationData?.verified) {
            return NextResponse.json({ message: 'Mobile number is already verified' }, { status: 400 });
        }

        if (!verificationData?.code) {
            return NextResponse.json({ message: 'No verification code is pending for this user' }, { status: 400 });
        }

        if (verificationData.code !== code) {
            return NextResponse.json({ message: 'Invalid verification code' }, { status: 400 });
        }

        const expiresAtTimestamp = verificationData.expiresAt as Timestamp;
        const expirationTime = expiresAtTimestamp.toMillis() + CODE_VALIDITY_DURATION_MS;

        if (Date.now() > expirationTime) {
            await userDocRef.update({
                'verification.mobile.code': FieldValue.delete(),
                'verification.mobile.expiresAt': FieldValue.delete()
            });
            return NextResponse.json({ message: 'Verification code has expired. Please request a new one.' }, { status: 400 });
        }

        await userDocRef.update({
            'mobileVerified': true, 
            'verification.mobile.verified': true,
            'verification.mobile.code': FieldValue.delete(), 
            'verification.mobile.expiresAt': FieldValue.delete(), 
            'updatedAt': FieldValue.serverTimestamp()
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
                    code: undefined,
                    expiresAt: undefined,
                }
            },
        };

        return NextResponse.json(serializedUser);

    } catch (error) {
        console.error('Error verifying SMS code:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}