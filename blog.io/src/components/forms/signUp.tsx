/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebase';
import AuthLayout from './AuthLayout';
import { createSessionClient } from '@/actions/localStorage';

const SignupPage = () => {
  const [firebaseError, setFirebaseError] = useState('');
  const router = useRouter();

  const initialValues = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  const validationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    username: Yup.string()
      .required('Username is required')
      .min(3, 'Username must be at least 3 characters')
      .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Please confirm your password'),
  });

  const handleSignup = async (values: typeof initialValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    setFirebaseError('');
    try {
      // 1. Create the user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      // 2. Create the user document in Firestore
      console.log('Creating user document for:', user.uid);
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username.toLowerCase(),
        email: values.email,
        createdAt: new Date(),
      });

      // 3. Get the ID token from the new user
      const idToken = await user.getIdToken();
      localStorage.setItem('blogToken', idToken);
      await createSessionClient(idToken);
      
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setFirebaseError('This email address is already in use.');
      } else {
        setFirebaseError('Failed to create an account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSignup}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            {firebaseError && <p className="bg-red-900/50 text-red-300 p-3 rounded-md text-sm">{firebaseError}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName">First Name</label>
                <Field name="firstName" type="text" className="auth-input" />
                <ErrorMessage name="firstName" component="p" className="auth-error" />
              </div>
              <div>
                <label htmlFor="lastName">Last Name</label>
                <Field name="lastName" type="text" className="auth-input" />
                <ErrorMessage name="lastName" component="p" className="auth-error" />
              </div>
            </div>

            <div>
              <label htmlFor="username">Username</label>
              <Field name="username" type="text" className="auth-input" />
              <ErrorMessage name="username" component="p" className="auth-error" />
            </div>

            <div>
              <label htmlFor="email">Email address</label>
              <Field name="email" type="email" className="auth-input" />
              <ErrorMessage name="email" component="p" className="auth-error" />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <Field name="password" type="password" className="auth-input" />
              <ErrorMessage name="password" component="p" className="auth-error" />
            </div>

            <div>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <Field name="confirmPassword" type="password" className="auth-input" />
              <ErrorMessage name="confirmPassword" component="p" className="auth-error" />
            </div>

            <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-full flex cursor-pointer justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-fuchsia-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Account...' : 'Sign up'}
            </motion.button>
            
            <p className="text-center text-sm text-gray-400 pt-2">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-fuchsia-400 hover:text-fuchsia-300">
                Log in
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default SignupPage;