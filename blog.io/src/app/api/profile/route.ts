import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * @route GET /api/profile
 * @desc Fetch the authenticated user's profile data.
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { uid } = await verifyAuthToken(token);

        const userQuery = await dbAdmin.collection('users').where('uid', '==', uid).limit(1).get();
        if (userQuery.empty) {
            return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
        }
        
        const user = userQuery.docs[0].data();

        // Return just the user data
        return NextResponse.json(user);

    } catch (error) {
        console.error('Error fetching user profile:', error);
        if (error instanceof Error && error.message.includes('token')) {
             return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * @route PATCH /api/profile
 * @desc Update the authenticated user's profile data (e.g., firstName, lastName, photoURL).
 */
export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { uid } = await verifyAuthToken(token);
        const body = await request.json();
        
        const userQuery = await dbAdmin.collection('users').where('uid', '==', uid).limit(1).get();
        
        if (userQuery.empty) {
            return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
        }

        const userDocRef = userQuery.docs[0].ref;

        const updateData: { [key: string]: any } = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (body.firstName !== undefined) {
            updateData.firstName = body.firstName;
        }
        if (body.lastName !== undefined) {
            updateData.lastName = body.lastName;
        }
        if (body.photoURL !== undefined) {
            updateData.photoURL = body.photoURL;
        }
        if (body.mobile !== undefined) {
            updateData.mobile = body.mobile;
        }
        if (body.address !== undefined) {
            updateData.address = body.address;
        }

        if (body.emailVerified !== undefined) {
            updateData.emailVerified = body.emailVerified;
        }

        if (body.linkedin !== undefined) {
            updateData.linkedin = body.linkedin;
        }

        if (body.github !== undefined) {
            updateData.github = body.github;
        }

        // Check if any fields were actually provided
        if (Object.keys(updateData).length <= 1) {
             return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
        }

        await userDocRef.update(updateData);
        
        const updatedUserDoc = await userDocRef.get();
        const updatedUser = updatedUserDoc.data();

        // Return the updated user data
        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error) {
        console.error('Error updating profile:', error);
         if (error instanceof Error && error.message.includes('token')) {
             return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}