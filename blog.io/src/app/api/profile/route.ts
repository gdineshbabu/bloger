import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

/* ============================================
   🔹 Types
============================================ */

interface UserProfile {
  uid: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  mobile?: string;
  address?: string;
  emailVerified?: boolean;
  linkedin?: string;
  github?: string;
  assets?: string[];
  updatedAt?: FirebaseFirestore.FieldValue;
}

interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  mobile?: string;
  address?: string;
  emailVerified?: boolean;
  linkedin?: string;
  github?: string;
  newAssetUrl?: string;
  removeAssetUrl?: string;
}

interface UpdateData {
  [key: string]: unknown;

  firstName?: string;
  lastName?: string;
  photoURL?: string;
  mobile?: string;
  address?: string;
  emailVerified?: boolean;
  linkedin?: string;
  github?: string;
  assets?: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
}


/* ============================================
   📌 GET /api/profile
============================================ */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = await verifyAuthToken(token);

    const userQuery = await dbAdmin.collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    const user = userQuery.docs[0].data() as UserProfile;

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

/* ============================================
   📌 PATCH /api/profile
============================================ */

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = await verifyAuthToken(token);
    const body: ProfileUpdateRequest = await request.json();

    const userQuery = await dbAdmin.collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    const userDocRef = userQuery.docs[0].ref;

    const updateData: UpdateData = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Profile fields
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.photoURL !== undefined) updateData.photoURL = body.photoURL;
    if (body.mobile !== undefined) updateData.mobile = body.mobile;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.emailVerified !== undefined) updateData.emailVerified = body.emailVerified;
    if (body.linkedin !== undefined) updateData.linkedin = body.linkedin;
    if (body.github !== undefined) updateData.github = body.github;

    // Add asset
    if (body.newAssetUrl !== undefined) {
      updateData.assets = FieldValue.arrayUnion(body.newAssetUrl);
    }

    // Remove asset
    if (body.removeAssetUrl !== undefined) {
      updateData.assets = FieldValue.arrayRemove(body.removeAssetUrl);
    }

    // No fields to update
    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 });
    }

    await userDocRef.update(updateData);

    const updatedUserDoc = await userDocRef.get();
    const updatedUser = updatedUserDoc.data() as UserProfile;

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
