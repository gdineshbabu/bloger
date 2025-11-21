'use client';
import BlogApp from "@/components/homePage/homePage";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense>
      <BlogApp />
    </Suspense>
  );
}
