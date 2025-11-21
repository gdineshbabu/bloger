/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import AuthLayout from './AuthLayout';

const ForgotPasswordPage = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initialValues = {
    email: ''
  };

  const validationSchema = Yup.object({
    email: Yup.string().email('Invalid email address').required('Email is required'),
  });

  const handleReset = async (values: typeof initialValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, values.email);
      setMessage('Password reset link sent! Please check your inbox (and spam folder).');
    } catch (err: any) {
      setError('Failed to send reset email. Please ensure the email address is correct.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Reset your password">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleReset}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            {error && <p className="bg-red-900/50 text-red-300 p-3 rounded-md text-sm">{error}</p>}
            {message && <p className="bg-green-900/50 text-green-300 p-3 rounded-md text-sm">{message}</p>}

            {!message && (
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
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting || !!message}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex cursor-pointer justify-center py-3 px-4 rounded-md font-medium text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-fuchsia-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
            </motion.button>

            <p className="text-center text-sm text-gray-400 pt-2">
              Remembered your password?{' '}
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

export default ForgotPasswordPage;