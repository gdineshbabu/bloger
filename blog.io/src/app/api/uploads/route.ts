import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/firebase/authToken";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function POST(request: NextRequest) {
  if (!BUCKET_NAME) {
    console.error("AWS_S3_BUCKET_NAME environment variable is not set.");
    return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
  }

  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { uid } = await verifyAuthToken(token);
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ message: "No file uploaded" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type))
      return NextResponse.json({ message: "Invalid file type" }, { status: 400 });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop() || "jpg";
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `profilePictures/${uid}/${uniqueFileName}`;

    const upload = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: file.type,
    });

    await s3.send(upload);

    const photoURL = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${BUCKET_NAME}/${s3Key}`;
    return NextResponse.json({ photoURL }, { status: 200 });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    if (error instanceof Error && error.message.includes("token"))
      return NextResponse.json({ message: "Authentication error" }, { status: 401 });
    return NextResponse.json(
      { message: "Internal Server Error during upload", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!BUCKET_NAME) {
    console.error("AWS_S3_BUCKET_NAME environment variable is not set.");
    return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
  }

  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { uid } = await verifyAuthToken(token);

    const body = await request.json();
    const { photoURL } = body;
    if (!photoURL) {
      return NextResponse.json({ message: "Missing photoURL in request body" }, { status: 400 });
    }

    const url = new URL(photoURL);
    const s3Key = url.pathname.split('/').slice(2).join('/');

    if (!s3Key) {
       return NextResponse.json({ message: "Invalid photoURL format" }, { status: 400 });
    }

    if (!s3Key.startsWith(`profilePictures/${uid}/`)) {
      return NextResponse.json({ message: "Forbidden: You can only delete your own files" }, { status: 403 });
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3.send(deleteCommand);

    return NextResponse.json({ message: "File deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting file:", error);
    if (error instanceof Error && error.message.includes("token"))
      return NextResponse.json({ message: "Authentication error" }, { status: 401 });
    
    return NextResponse.json(
      { message: "Internal Server Error during deletion", error: error.message },
      { status: 500 }
    );
  }
}