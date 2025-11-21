/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, applyActionCode } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';
// @ts-expect-error: Suppress implicit any error for app import as source is untyped
import { app } from '@/firebase/firebaseClient';
import { Loader2Icon, CheckCircle2Icon, AlertCircleIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Cast app to FirebaseApp to ensure type safety in usage
// @ts-expect-error: Suppress implicit any error for app import as source is untyped
const auth = getAuth(app as FirebaseApp);

type VerificationStatus = 'verifying' | 'success' | 'error' | 'already-verified';

export default function EmailVerificationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [status, setStatus] = useState<VerificationStatus>('verifying');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const oobCode = searchParams.get('oobCode');

        if (!oobCode) {
            setStatus('error');
            setErrorMessage('Invalid verification link. Code is missing.');
            return;
        }

        handleVerifyEmail(oobCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, router]);

    const handleVerifyEmail = async (oobCode: string) => {
        setStatus('verifying');
        try {
            await applyActionCode(auth, oobCode);

            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('User session not found after verification.');
            }

            const token = await currentUser.getIdToken(true);
            localStorage.setItem('blogToken', token);

            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emailVerified: true }),
            });

            if (!response.ok) {
                throw new Error('Failed to update your profile. Please log in and try again.');
            }

            setStatus('success');
            toast.success('Email verified! Redirecting to your profile...');
            setTimeout(() => {
                router.push('/profile');
            }, 3000);

        } catch (error: unknown) {
            console.error('Email verification failed:', error);
            
            // Type narrowing for Firebase Auth errors
            const isAuthError = (err: unknown): err is { code: string; message: string } => {
                return typeof err === 'object' && err !== null && 'code' in err;
            };

            if (isAuthError(error) && error.code === 'auth/invalid-action-code') {
                setStatus('already-verified');
                toast.success('Email already verified. Redirecting to dashboard...');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            } else {
                setStatus('error');
                const msg = error instanceof Error ? error.message : 'An unknown error occurred.';
                setErrorMessage(msg);
                toast.error(msg || 'Verification failed.');
            }
        }
    };

    const VerificationStatus = () => {
        switch (status) {
            case 'verifying':
                return (
                    <>
                        <Loader2Icon className="w-12 h-12 text-fuchsia-400 animate-spin" />
                        <h1 className="text-2xl font-bold mt-6">Verifying your email...</h1>
                        <p className="text-gray-400 mt-2">Please wait a moment.</p>
                    </>
                );
            case 'success':
                return (
                    <>
                        <CheckCircle2Icon className="w-12 h-12 text-green-500" />
                        <h1 className="text-2xl font-bold mt-6">Email Verified! ✅</h1>
                        <p className="text-gray-400 mt-2">We are redirecting you to your profile page...</p>
                    </>
                );
            case 'already-verified':
                return (
                    <>
                        <AlertCircleIcon className="w-12 h-12 text-yellow-500" />
                        <h1 className="text-2xl font-bold mt-6">Email Already Verified</h1>
                        <p className="text-gray-400 mt-2">Please continue to your dashboard.</p>
                    </>
                );
            case 'error':
                return (
                    <>
                        <AlertCircleIcon className="w-12 h-12 text-red-500" />
                        <h1 className="text-2xl font-bold mt-6">Verification Failed</h1>
                        <p className="text-gray-400 mt-2 max-w-sm">{errorMessage}</p>
                    </>
                );
        }
    };

    return (
        <>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: '#1f2937',
                        color: '#f9fafb',
                        border: '1px solid #374151',
                    },
                }}
            />
            <div className="bg-gray-950 text-white min-h-screen font-sans flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 shadow-xl max-w-md w-full flex flex-col items-center">
                    <h1 className="text-3xl font-bold mb-8">
                        blog<span className="text-fuchsia-400">.io</span>
                    </h1>
                    <VerificationStatus />
                </div>
            </div>
        </>
    );
}
