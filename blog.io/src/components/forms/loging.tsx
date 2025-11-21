/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import AuthLayout from './AuthLayout';
import { createSessionClient } from '@/actions/localStorage';

const LoginPage = () => {
  const [firebaseError, setFirebaseError] = useState('');
  const router = useRouter();

  const initialValues = {
    email: '',
    password: ''
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const handleLogin = async (values: typeof initialValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    setFirebaseError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const idToken = await userCredential.user.getIdToken();

      // Set the secure, httpOnly cookie
      localStorage.setItem('blogToken', idToken);
      await createSessionClient(idToken);

      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setFirebaseError('Invalid email or password. Please try again.');
      } else {
        setFirebaseError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };
    
  return (
    <AuthLayout title="Log in to your account">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleLogin}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            {firebaseError && <p className="bg-red-900/50 text-red-300 p-3 rounded-md text-sm">{firebaseError}</p>}
            
            <div>
              <label htmlFor="email">Email address</label>
              <Field 
                id="email" 
                name="email" 
                type="email" 
                className="auth-input" 
              />
              <ErrorMessage name="email" component="p" className="auth-error" />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password">Password</label>
                <Link href="/forgot-password" className="text-sm font-medium text-fuchsia-400 hover:text-fuchsia-300">
                  Forgot password?
                </Link>
              </div>
              <Field 
                id="password" 
                name="password" 
                type="password" 
                className="auth-input" 
              />
              <ErrorMessage name="password" component="p" className="auth-error" />
            </div>

            <motion.button 
              type="submit" 
              disabled={isSubmitting} 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="w-full cursor-pointer flex justify-center py-3 px-4 rounded-md font-medium text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-fuchsia-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </motion.button>

            <p className="text-center text-sm text-gray-400 pt-2">
              New here?{' '}
              <Link href="/signup" className="font-medium text-fuchsia-400 hover:text-fuchsia-300">
                  Create an account
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default LoginPage;