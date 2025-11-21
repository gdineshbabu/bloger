import { dbAdmin } from '@/firebase/firebaseAdmin';
import { verifyAuthToken } from '@/firebase/authToken';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

// ------------------
// Type Definitions
// ------------------

interface Site {
  id?: string;
  ownerId: string;
  title: string;
  subdomain: string;
  type: string;
  template: string;
  status: 'draft' | 'published';
  createdAt?: FirebaseFirestore.Timestamp | null;
  updatedAt?: FirebaseFirestore.Timestamp | null;
  isFavourite?: boolean;
  content?: unknown;
  pageStyles?: unknown;
  stats: {
    views: number;
    posts: number;
  };
}

interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  [key: string]: unknown;
}


// ------------------
// GET Dashboard Data
// ------------------
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = await verifyAuthToken(token);

    const userQuery = await dbAdmin
      .collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json({ message: 'User profile not found' }, { status: 404 });
    }

    const user = userQuery.docs[0].data() as UserProfile;

    // Fetch Sites
    const sitesSnapshot = await dbAdmin
      .collection('sites')
      .where('ownerId', '==', uid)
      .get();

    const allSites: Site[] = sitesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Site),
    }));

    // Fetch Recent Posts
    const postsSnapshot = await dbAdmin
      .collection('posts')
      .where('authorId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const recentPosts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Total Posts Count
    const totalPostsSnapshot = await dbAdmin
      .collection('posts')
      .where('authorId', '==', uid)
      .get();

    // Compute total views
    const totalViews = allSites.reduce(
      (acc, site) => acc + (site.stats?.views ?? 0),
      0
    );

    const stats = {
      totalSites: allSites.length,
      totalPosts: totalPostsSnapshot.size,
      totalViews,
    };

    // Sort sites
    const sortedSites = allSites.sort((a, b) => {
      if (a.isFavourite && !b.isFavourite) return -1;
      if (!a.isFavourite && b.isFavourite) return 1;

      const timeA = a.createdAt ? a.createdAt.seconds : 0;
      const timeB = b.createdAt ? b.createdAt.seconds : 0;

      return timeB - timeA;
    });

    return NextResponse.json({
      user,
      sites: sortedSites,
      recentPosts,
      stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


// ------------------
// POST — Create Site
// ------------------
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = await verifyAuthToken(token);
    const { title, subdomain, type, template } = (await request.json()) as {
      title: string;
      subdomain: string;
      type: string;
      template: string;
    };

    if (!title || !subdomain || !type || !template) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const sanitizedSubdomain = subdomain
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const existingSite = await dbAdmin
      .collection('sites')
      .where('subdomain', '==', sanitizedSubdomain)
      .get();

    if (!existingSite.empty) {
      return NextResponse.json({ message: 'Subdomain is already taken' }, { status: 409 });
    }

    const newSiteData: Site = {
      ownerId: uid,
      title,
      subdomain: sanitizedSubdomain,
      type,
      template,
      createdAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
      stats: { views: 0, posts: 0 },
      status: 'draft',
    };

    const docRef = await dbAdmin.collection('sites').add(newSiteData);
    const newSiteSnapshot = await docRef.get();

    const newSite: Site = {
      id: newSiteSnapshot.id,
      ...(newSiteSnapshot.data() as Site),
    };

    return NextResponse.json({ site: newSite }, { status: 201 });
  } catch (error) {
    console.error('Error creating site:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


// ------------------
// PUT — Update Site
// ------------------
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split('Bearer ')[1];
    const siteId = request.nextUrl.pathname.split('/').pop();

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { uid } = await verifyAuthToken(token);

    const { content, pageStyles } = (await request.json()) as {
      content: unknown;
      pageStyles: unknown;
    };

    if (!siteId || !content || !pageStyles) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const siteRef = dbAdmin.collection('sites').doc(siteId);
    const siteDoc = await siteRef.get();

    if (!siteDoc.exists) {
      return NextResponse.json({ message: 'Site not found' }, { status: 404 });
    }

    const siteData = siteDoc.data() as Site;

    if (siteData.ownerId !== uid) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await siteRef.update({
      content,
      pageStyles,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { message: 'Site updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating site:', error);
    if (error instanceof Error && error.message.includes('token')) {
      return NextResponse.json({ message: 'Authentication error' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
