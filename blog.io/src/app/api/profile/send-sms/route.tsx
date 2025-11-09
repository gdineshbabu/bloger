import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { uid } = await verifyAuthToken(token);
        const { mobile } = await request.json();

        if (!mobile) {
            return NextResponse.json({ message: 'Mobile number is required' }, { status: 400 });
        }

        const userQuery = await dbAdmin.collection('users').where('uid', '==', uid).limit(1).get();
        if (userQuery.empty) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        console.log(`MOCK SMS: Sending code ${verificationCode} to user ${uid} at ${mobile}`);
        
        const userDocRef = userQuery.docs[0].ref;
        await userDocRef.update({
            'verification.mobile.code': verificationCode,
            'verification.mobile.expiresAt': FieldValue.serverTimestamp() 
        });

        await userDocRef.update({ mobile });

        return NextResponse.json({ success: true, message: 'Verification code sent (mock)' });

    } catch (error) {
        console.error('Error sending SMS:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}