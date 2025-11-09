'use client';

import React, { useState, useEffect, ReactNode, useRef, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { clearSessionClient } from '@/actions/localStorage';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

import { 
    getAuth, 
    sendEmailVerification,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    PhoneAuthProvider,
    linkWithCredential
} from 'firebase/auth';
import { app } from '@/firebase/firebaseClient'; 

import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import { 
    EditIcon, UserIcon, Loader2Icon,
    MailIcon, CalendarIcon, CameraIcon, CheckCircle2Icon, AlertCircleIcon,
    MapPinIcon, LinkedinIcon, ExternalLinkIcon, LinkIcon,
    GithubIcon 
} from 'lucide-react';
import { DashboardLayout } from '../loader/skeletonLoaders';

export interface FirestoreTimestamp {
    _seconds: number;
    _nanoseconds: number;
}

export interface UserProfile {
    firstName: string;
    lastName?: string;
    email: string;
    photoURL?: string;
    createdAt: FirestoreTimestamp;
    emailVerified: boolean;
    mobile?: string;
    mobileVerified?: boolean;
    address?: string;
    linkedin?: string;
    github?: string; 
}

export interface Site {
    [key: string]: any;
}

export const SiteStatus = {}; 

export interface RecentPost {
    [key: string]: any; 
}

export interface Stats {
    [key: string]: any; 
}

export interface UserData {
    user: UserProfile;
    sites: Site[];
    recentPosts: RecentPost[]; 
    stats: Stats;             
}

export interface FormDataState {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    address: string;
    linkedin: string;
    github: string;
}

export interface FormErrorState {
    linkedin: string;
    github: string;
    mobile: string; 
}

const auth = getAuth(app);

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

const formatDate = (timestamp: FirestoreTimestamp) => {
    if (timestamp && typeof timestamp._seconds === 'number') {
        return new Date(timestamp._seconds * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    return 'N/A';
};

const ProfileInput = ({ label, id, value, onChange, disabled = false, type = 'text', icon: Icon, error }: {
    label: string,
    id: string,
    value: string,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    disabled?: boolean,
    type?: string,
    icon?: ReactNode,
    error?: string 
}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    {Icon}
                </div>
            )}
            <input
                type={type}
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full bg-gray-900 border rounded-lg py-2.5 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                    error
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-700 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500'
                } disabled:opacity-50 disabled:cursor-not-allowed ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
            />
        </div>
        {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
    </div>
);

const ProfilePhoneInput = ({ label, id, value, onChange, disabled = false, error }: {
    label: string,
    id: string,
    value: string,
    onChange: (value: string | undefined) => void,
    disabled?: boolean,
    error?: string
}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <div className="relative">
            <PhoneInput
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                disabled={disabled}
                international
                defaultCountry="US"
                className={error ? 'PhoneInputWrapper PhoneInputWrapper--error' : 'PhoneInputWrapper'}
            />
        </div>
        {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
    </div>
);

const ProfileInputGroup = ({ label, id, value, onChange, disabled = false, type = 'text', icon: Icon, buttonText, onButtonClick, isButtonLoading = false, buttonDisabled = false, verificationStatus }: {
    label: string,
    id: string,
    value: string,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    disabled?: boolean,
    type?: string,
    icon?: ReactNode,
    buttonText: string,
    onButtonClick: () => void,
    isButtonLoading?: boolean,
    buttonDisabled?: boolean,
    verificationStatus?: 'verified' | 'unverified' | 'pending'
}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {Icon}
                    </div>
                )}
                <input
                    type={type}
                    id={id}
                    name={id}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className={`w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
                />
                 {verificationStatus && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {verificationStatus === 'verified' && <CheckCircle2Icon className="w-5 h-5 text-green-500" />}
                        {verificationStatus === 'unverified' && <AlertCircleIcon className="w-5 h-5 text-yellow-500" />}
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={onButtonClick}
                disabled={isButtonLoading || buttonDisabled}
                className="cursor-pointer h-11 px-4 py-2 rounded-lg bg-gray-700 text-sm font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                {isButtonLoading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : buttonText}
            </button>
        </div>
    </div>
);


const ProfileAvatarCard = ({ user, onEditClick, onFileChange, fileInputRef, isUploading }: {
    user: UserProfile, 
    onEditClick: () => void,
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void,
    fileInputRef: React.RefObject<HTMLInputElement>,
    isUploading: boolean
}) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02 }} 
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 lg:p-8 flex flex-col items-center text-center h-full"
    >
        <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            accept="image/png, image/jpeg, image/gif"
            className="hidden"
            disabled={isUploading}
        />
        <div className="relative w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600 mb-6 overflow-hidden">
            {user?.photoURL ? (
                <Image key={user.photoURL} src={user.photoURL} alt="Profile" className="w-full h-full object-cover" width={100} height={100} />
            ) : (
                <UserIcon className="w-16 h-16 text-gray-400" />
            )}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="cursor-pointer absolute inset-0 w-full h-full rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity disabled:opacity-70 disabled:cursor-wait"
            >
                {isUploading ? (
                    <Loader2Icon className="w-8 h-8 animate-spin" />
                ) : (
                    <CameraIcon className="w-8 h-8" />
                )}
            </button>
            {isUploading && (
                 <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <Loader2Icon className="w-8 h-8 animate-spin text-fuchsia-400" />
                 </div>
            )}
        </div>
        
        <h3 className="text-2xl font-bold text-white">
            {user?.firstName} {user?.lastName || ''}
        </h3>
        <p className="text-gray-400 mt-2">{user?.email}</p>
        <div className="border-t border-gray-700 w-full my-6"></div>
        <div className="flex items-center gap-3 text-gray-400">
            <CalendarIcon className="w-5 h-5" />
            <span>Joined {formatDate(user?.createdAt)}</span>
        </div>
        <button
            onClick={onEditClick}
            className="cursor-pointer mt-8 w-full bg-fuchsia-500 hover:bg-fuchsia-600 flex items-center justify-center gap-2 text-white font-semibold px-4 py-2.5 rounded-lg transition-all transform hover:scale-105"
        >
            <EditIcon className="w-4 h-4" />
            Edit Profile
        </button>
    </motion.div>
);

const ProfileDetailsCard = ({
    user,
    isEditing,
    formData,
    formErrors, 
    onFormChange,
    onPhoneChange, 
    onSave,
    onCancel,
    isSubmitting
}: {
    user: UserProfile, 
    isEditing: boolean,
    formData: FormDataState, 
    formErrors: FormErrorState, 
    onFormChange: (e: ChangeEvent<HTMLInputElement>) => void,
    onPhoneChange: (value: string | undefined) => void, 
    onSave: (e: FormEvent<HTMLFormElement>) => void,
    onCancel: () => void,
    isSubmitting: boolean
}) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        whileHover={{ scale: 1.02 }} 
        className="bg-gray-800/50 border border-gray-700 rounded-lg h-full"
    >
        <div className="p-6 lg:p-8 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Account Details</h3>
            <p className="text-sm text-gray-400 mt-1">Manage your account information.</p>
        </div>
        <form onSubmit={onSave}>
            <div className="p-6 lg:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileInput
                        label="First Name"
                        id="firstName"
                        value={formData.firstName}
                        onChange={onFormChange}
                        disabled={!isEditing}
                        icon={<UserIcon className="w-5 h-5" />}
                    />
                    <ProfileInput
                        label="Last Name"
                        id="lastName"
                        value={formData.lastName}
                        onChange={onFormChange}
                        disabled={!isEditing}
                        icon={<UserIcon className="w-5 h-5" />}
                    />
                </div>
                
                <ProfilePhoneInput
                    label="Mobile Number"
                    id="mobile"
                    value={formData.mobile}
                    onChange={onPhoneChange}
                    disabled={!isEditing}
                    error={formErrors.mobile}
                />

                <ProfileInput
                    label="Address / Location"
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={onFormChange}
                    disabled={!isEditing}
                    icon={<MapPinIcon className="w-5 h-5" />}
                />
            </div>
            {isEditing && (
                <div className="px-6 lg:px-8 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cursor-pointer px-4 py-2 rounded-lg bg-gray-700 text-sm font-semibold hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="cursor-pointer px-4 py-2 rounded-lg bg-fuchsia-600 text-sm font-semibold hover:bg-fuchsia-700 transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            )}
        </form>
    </motion.div>
);

const ProfileVerificationCard = ({
    user,
    formData,
    formErrors, 
    onFormChange,
    onPhoneChange, 
    onSendEmailVerification,
    isSendingEmail,
    onSendSmsCode,
    isSendingSms,
    onVerifySmsCode,
    isVerifyingSms,
    smsCode,
    setSmsCode,
    mobileVerificationSent
}: {
    user: UserProfile, 
    formData: FormDataState,
    formErrors: FormErrorState, 
    onFormChange: (e: ChangeEvent<HTMLInputElement>) => void,
    onPhoneChange: (value: string | undefined) => void, 
    onSendEmailVerification: () => void,
    isSendingEmail: boolean,
    onSendSmsCode: () => void,
    isSendingSms: boolean,
    onVerifySmsCode: (e: FormEvent<HTMLFormElement>) => void,
    isVerifyingSms: boolean,
    smsCode: string,
    setSmsCode: (code: string) => void,
    mobileVerificationSent: boolean
}) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ scale: 1.02 }} 
        className="bg-gray-800/50 border border-gray-700 rounded-lg h-full"
    >
        <div className="p-6 lg:p-8 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Account Verification</h3>
            <p className="text-sm text-gray-400 mt-1">Verify your identity.</p>
        </div>
        <div className="p-6 lg:p-8 space-y-6">
            <ProfileInputGroup
                label="Email Address"
                id="email"
                type="email"
                value={formData.email}
                onChange={onFormChange}
                disabled 
                icon={<MailIcon className="w-5 h-5" />}
                buttonText={user.emailVerified ? "Verified" : "Send Verification"}
                onButtonClick={onSendEmailVerification}
                isButtonLoading={isSendingEmail}
                buttonDisabled={user.emailVerified || isSendingEmail}
                verificationStatus={user.emailVerified ? 'verified' : 'unverified'}
            />

            <div className="border-t border-gray-700 w-full"></div>

            <ProfilePhoneInput
                label="Mobile Number"
                id="mobileForVerification"
                value={formData.mobile}
                onChange={onPhoneChange}
                disabled={true}
                error={formErrors.mobile}
            />

            {!user.mobileVerified && (
                <>
                    <div id="recaptcha-container"></div> 

                    <button
                        type="button"
                        onClick={onSendSmsCode}
                        disabled={isSendingSms || !formData.mobile}
                        className="cursor-pointer w-full px-4 py-2 rounded-lg bg-gray-700 text-sm font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                    >
                        {isSendingSms && <Loader2Icon className="w-4 h-4 animate-spin" />}
                        {mobileVerificationSent ? "Resend Code" : "Send Verification Code"}
                    </button>

                    {mobileVerificationSent && (
                        <form onSubmit={onVerifySmsCode} className="flex items-center gap-3">
                            <div className="flex-1">
                                <label htmlFor="smsCode" className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                                <input
                                    type="text"
                                    id="smsCode"
                                    name="smsCode"
                                    value={smsCode}
                                    onChange={(e) => setSmsCode(e.target.value)}
                                    disabled={isVerifyingSms}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isVerifyingSms || !smsCode}
                                className="cursor-pointer h-11 mt-auto px-4 py-2 rounded-lg bg-fuchsia-600 text-sm font-semibold hover:bg-fuchsia-700 transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                            >
                                {isVerifyingSms && <Loader2Icon className="w-4 h-4 animate-spin" />}
                                Verify
                            </button>
                        </form>
                    )}
                </>
            )}
             {user.mobileVerified && (
                <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">Mobile number verified</span>
                </div>
            )}
        </div>
    </motion.div>
);

const ProfileSocialsCard = ({
    isEditing,
    formData,
    errors, 
    onFormChange,
    onSave,
    onCancel,
    isSubmitting
}: {
    isEditing: boolean,
    formData: FormDataState,
    errors: FormErrorState, 
    onFormChange: (e: ChangeEvent<HTMLInputElement>) => void,
    onSave: (e: FormEvent<HTMLFormElement>) => void,
    onCancel: () => void,
    isSubmitting: boolean
}) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        className="bg-gray-800/50 border border-gray-700 rounded-lg h-full"
    >
        <div className="p-6 lg:p-8 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">Social Links</h3>
            <p className="text-sm text-gray-400 mt-1">Link your accounts to share your work.</p>
        </div>
        <form onSubmit={onSave}>
            <div className="p-6 lg:p-8 space-y-6">
                <ProfileInput
                    label="LinkedIn Profile"
                    id="linkedin"
                    type="url"
                    value={formData.linkedin}
                    onChange={onFormChange}
                    disabled={!isEditing}
                    icon={<LinkedinIcon className="w-5 h-5" />}
                    error={errors.linkedin} 
                />
                
                <ProfileInput
                    label="GitHub Profile"
                    id="github"
                    type="url"
                    value={formData.github}
                    onChange={onFormChange}
                    disabled={!isEditing}
                    icon={<GithubIcon className="w-5 h-5" />}
                    error={errors.github} 
                />
                
                {!isEditing && (formData.linkedin || formData.github) && (
                     <div className="space-y-4 pt-4">
                        {formData.linkedin && (
                            <a
                                href={formData.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 text-white font-semibold px-4 py-2.5 rounded-lg transition-all transform hover:scale-105"
                            >
                                <ExternalLinkIcon className="w-4 h-4" />
                                View LinkedIn Profile
                            </a>
                        )}
                        {formData.github && (
                            <a
                                href={formData.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer w-full bg-gray-900 hover:bg-black border border-gray-700 flex items-center justify-center gap-2 text-white font-semibold px-4 py-2.5 rounded-lg transition-all transform hover:scale-105"
                            >
                                <GithubIcon className="w-4 h-4" />
                                View GitHub Profile
                            </a>
                        )}
                    </div>
                )}
                
                {!isEditing && !formData.linkedin && !formData.github && (
                     <div className="flex items-center gap-2 text-gray-400">
                        <LinkIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">No social profiles linked.</span>
                    </div>
                )}
            </div>
             {isEditing && (
                <div className="px-6 lg:px-8 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cursor-pointer px-4 py-2 rounded-lg bg-gray-700 text-sm font-semibold hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="cursor-pointer px-4 py-2 rounded-lg bg-fuchsia-600 text-sm font-semibold hover:bg-fuchsia-700 transition-all transform hover:scale-105 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            )}
        </form>
    </motion.div>
);


const ProfileSkeleton = () => {
    const SkeletonCard = () => (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 lg:p-8 animate-pulse h-full">
            <div className="h-32 w-32 rounded-full bg-gray-700 mx-auto mb-6"></div>
            <div className="h-7 bg-gray-700 rounded w-3/4 mx-auto mb-3"></div>
            <div className="h-5 bg-gray-700 rounded w-1/2 mx-auto mb-6"></div>
            <div className="border-t border-gray-700 w-full my-6"></div>
            <div className="h-5 bg-gray-700 rounded w-2/3 mx-auto mb-8"></div>
            <div className="h-10 bg-gray-700 rounded w-full"></div>
        </div>
    );
    
    const SkeletonForm = () => (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg animate-pulse">
            <div className="p-6 lg:p-8 border-b border-gray-700">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="p-6 lg:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-10 bg-gray-700 rounded w-full"></div>
                    </div>
                    <div>
                        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-10 bg-gray-700 rounded w-full"></div>
                    </div>
                </div>
                <div>
                    <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-700 rounded w-full"></div>
                </div>
                <div>
                    <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-700 rounded w-full"></div>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <header className="mb-8 animate-pulse">
                <div className="h-10 bg-gray-700 rounded w-48 mb-3"></div>
                <div className="h-5 bg-gray-700 rounded w-80"></div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 row-span-2">
                    <SkeletonCard />
                </div>
                <div className="lg:col-span-2">
                    <SkeletonForm />
                </div>
                <div className="lg:col-span-2">
                    <SkeletonForm />
                </div>
                <div className="lg:col-span-2 lg:col-start-2">
                    <SkeletonForm />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default function ProfilePage() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false); 
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isSendingSms, setIsSendingSms] = useState(false);
    const [mobileVerificationSent, setMobileVerificationSent] = useState(false);
    const [smsCode, setSmsCode] = useState("");
    const [isVerifyingSms, setIsVerifyingSms] = useState(false);
    const [verificationId, setVerificationId] = useState<string | null>(null);
    
    const [formData, setFormData] = useState<FormDataState>({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        address: '',
        linkedin: '',
        github: ''
    });

    const [formErrors, setFormErrors] = useState<FormErrorState>({
        linkedin: '',
        github: '',
        mobile: ''
    });

    const router = useRouter();

    const validateField = (name: string, value: string): string => {
        if (name === 'linkedin' || name === 'github') {
            if (!value) return ''; 

            let url;
            try {
                url = new URL(value);
            } catch (_) {
                return 'Please enter a valid URL (e.g., https://...)';
            }

            if (name === 'linkedin' && !url.hostname.includes('linkedin.com')) {
                return 'Please enter a valid LinkedIn URL.';
            }

            if (name === 'github' && !url.hostname.includes('github.com')) {
                return 'Please enter a valid GitHub URL.';
            }
        }

        if (name === 'mobile') {
            if (value && !isValidPhoneNumber(value)) {
                return 'Please enter a valid mobile number.';
            }
        }

        return ''; 
    };

    useEffect(() => {
        const setupRecaptcha = () => {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible',
                    'callback': (response: unknown) => { 
                        console.log("reCAPTCHA solved");
                    }
                });
            }
        };

        if (userData && !userData.user.mobileVerified) {
            setupRecaptcha();
        }

    }, [userData]);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const token = localStorage.getItem("blogToken");
                if (!token) { router.push('/login'); return; }
                
                const response = await fetch('/api/profile', { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                
                if (!response.ok) { 
                    if (response.status === 401) {
                        clearSessionClient();
                        router.push('/login'); 
                    }
                    throw new Error('Failed to fetch user data'); 
                }
                
                const user: UserProfile = await response.json();
                
                setUserData({ 
                    user, 
                    sites: [], 
                    recentPosts: [],
                    stats: {} 
                });

                if (user) {
                    setFormData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '', 
                        email: user.email || '',
                        mobile: user.mobile || '',
                        address: user.address || '',
                        linkedin: user.linkedin || '',
                        github: user.github || '',
                    });
                }
            } catch (error) { 
                console.error(error); 
                toast.error('Failed to fetch your profile.');
            } finally { 
                setLoading(false); 
            }
        }
        fetchData();
    }, [router]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async (file: File) => {
        const token = localStorage.getItem("blogToken");
        if (!token) {
            toast.error("Authentication error. Please log in again.");
            return;
        }

        setIsUploading(true);
        const uploadToastId = toast.loading('Uploading image...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadResponse = await fetch('/api/uploads', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.message || 'Image upload failed.');
            }

            const { photoURL: s3Url } = await uploadResponse.json();

            const profileUpdateResponse = await fetch('/api/profile', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ photoURL: s3Url }),
            });

            if (!profileUpdateResponse.ok) {
                 const errorData = await profileUpdateResponse.json();
                throw new Error(errorData.message || 'Failed to save profile picture URL.');
            }

            const updatedUser: UserProfile = await profileUpdateResponse.json();

            setUserData(prev => prev ? ({ ...prev, user: updatedUser }) : null);

            toast.success('Profile picture updated!', { id: uploadToastId });

        } catch (error: any) {
            console.error('Upload process failed:', error);
            toast.error(error.message || 'An error occurred during upload.', { id: uploadToastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'linkedin' || name === 'github') {
            const error = validateField(name, value);
            setFormErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    const handlePhoneChange = (value: string | undefined) => {
        const mobileValue = value || '';
        setFormData(prev => ({
            ...prev,
            mobile: mobileValue
        }));

        const error = validateField('mobile', mobileValue);
        setFormErrors(prev => ({
            ...prev,
            mobile: error
        }));
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const linkedinError = validateField('linkedin', formData.linkedin);
        const githubError = validateField('github', formData.github);
        const mobileError = validateField('mobile', formData.mobile); 

        if (linkedinError || githubError || mobileError) { 
            setFormErrors({
                linkedin: linkedinError,
                github: githubError,
                mobile: mobileError 
            });
            toast.error('Please fix the errors in your profile.');
            return; 
        }

        if (isUploading) {
            toast.error("Please wait for the image upload to complete.");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("blogToken");
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    mobile: formData.mobile,
                    address: formData.address,
                    linkedin: formData.linkedin,
                    github: formData.github,
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile.');
            }

            const updatedUser: UserProfile = await response.json();

            setUserData(prev => prev ? ({ ...prev, user: updatedUser }) : null);
            
            setFormData({
                firstName: updatedUser.firstName || '',
                lastName: updatedUser.lastName || '',
                email: updatedUser.email || '',
                mobile: updatedUser.mobile || '',
                address: updatedUser.address || '',
                linkedin: updatedUser.linkedin || '',
                github: updatedUser.github || '',
            });

            toast.success('Profile updated successfully!');
            setIsEditing(false);
            setFormErrors({ linkedin: '', github: '', mobile: '' }); 

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to update profile.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCancel = () => {
        setIsEditing(false);
        setFormErrors({ linkedin: '', github: '', mobile: '' }); 

        if (userData?.user) {
            setFormData({
                firstName: userData.user.firstName || '',
                lastName: userData.user.lastName || '',
                email: userData.user.email || '',
                mobile: userData.user.mobile || '',
                address: userData.user.address || '',
                linkedin: userData.user.linkedin || '',
                github: userData.user.github || '',
            });
        }
    };

    const handleSendEmailVerification = async () => {
        setIsSendingEmail(true);
        const currentUser = auth.currentUser;

        if (!currentUser) {
            toast.error("No user logged in. Please refresh.");
            setIsSendingEmail(false);
            return;
        }
        
        try {
            await sendEmailVerification(currentUser);
            toast.success("Verification email sent! Check your inbox.");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to send verification email.");
        } finally {
            setIsSendingEmail(false);
        }
    };
    
    const handleSendSmsCode = async () => {
        setIsSendingSms(true);
        try {
            const verifier = window.recaptchaVerifier;
            if (!verifier) {
                throw new Error("reCAPTCHA verifier not initialized.");
            }
            
            const mobileNumber = formData.mobile;
            
            if (!mobileNumber || !isValidPhoneNumber(mobileNumber)) {
                setFormErrors(prev => ({ ...prev, mobile: 'Please enter a valid mobile number first.' }));
                toast.error('Please enter a valid mobile number.');
                throw new Error("Invalid phone number format.");
            }

            setFormErrors(prev => ({ ...prev, mobile: '' }));

            const confirmationResult = await signInWithPhoneNumber(auth, mobileNumber, verifier);
            
            setVerificationId(confirmationResult.verificationId);
            setMobileVerificationSent(true);
            toast.success('Verification code sent to your mobile!');

        } catch (error: any) {
            console.error(error);
            if (error.message !== "Invalid phone number format.") {
                 toast.error(error.message || 'Failed to send SMS code.');
            }
            window.recaptchaVerifier?.render().then((widgetId) => {
                 window.grecaptcha.reset(widgetId);
            });
        } finally {
            setIsSendingSms(false);
        }
    };

    const handleVerifySmsCode = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsVerifyingSms(true);

        if (!verificationId) {
            toast.error("No verification in progress. Please send a code first.");
            setIsVerifyingSfs(false);
            return;
        }
        
        const token = localStorage.getItem("blogToken");
        if (!token || !auth.currentUser) {
            toast.error("Authentication error. Please log in again.");
            setIsVerifyingSms(false);
            return;
        }

        try {
            const credential = PhoneAuthProvider.credential(verificationId, smsCode);

            await linkWithCredential(auth.currentUser, credential);

            const response = await fetch('/api/profile/mark-mobile-verified', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile after verification.');
            }
            
            const updatedUser: UserProfile = await response.json();
            
            setUserData(prev => prev ? ({ ...prev, user: updatedUser }) : null);

            toast.success('Mobile number verified!');
            setMobileVerificationSent(false);
            setSmsCode("");
            setVerificationId(null);

        } catch (error: any) {
            console.error(error);
            
            const errorMessage = 
                error.code === 'auth/invalid-verification-code'
                    ? 'Invalid verification code.'
                    : error.message || 'Verification failed.';
            
            toast.error(errorMessage);
        } finally {
            setIsVerifyingSms(false);
        }
    };

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!userData || !userData.user) {
         return (
             <DashboardLayout>
                 <div className="text-center py-20">
                     <p className="text-lg text-gray-400">Could not load user profile.</p>
                 </div>
             </DashboardLayout>
         );
    }

    return (
        <>
            <style jsx global>{`
                .PhoneInputWrapper .PhoneInputInput {
                    width: 100%;
                    background-color: #030712; 
                    border: 1px solid #374151; 
                    border-radius: 0.5rem; 
                    padding-top: 0.625rem;    
                    padding-bottom: 0.625rem; 
                    padding-left: 0.75rem;   
                    color: white;
                    transition: all 0.2s;
                }
                .PhoneInputWrapper .PhoneInputInput::placeholder {
                     color: #6b7280; 
                }
                .PhoneInputWrapper .PhoneInputInput:focus {
                    outline: none;
                    border-color: #d946ef; 
                    box-shadow: 0 0 0 2px #d946ef; 
                }
                .PhoneInputWrapper .PhoneInputInput--disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .PhoneInputWrapper--error .PhoneInputInput {
                    border-color: #ef4444; 
                }
                .PhoneInputWrapper--error .PhoneInputInput:focus {
                    border-color: #ef4444; 
                    box-shadow: 0 0 0 2px #ef4444; 
                }

                .PhoneInputWrapper .PhoneInputCountrySelect {
                    background: #1f2937; 
                    border: 1px solid #374151; 
                    border-radius: 0.5rem;
                    margin-right: 0.5rem;
                }
                .PhoneInputWrapper .PhoneInputCountrySelect:hover {
                    background: #374151; 
                }
                .PhoneInputWrapper .PhoneInputCountrySelectArrow {
                    color: #9ca3af; 
                    opacity: 0.7;
                }
                .PhoneInputWrapper .PhoneInputCountrySelect:focus {
                    outline: none;
                    border-color: #d946ef;
                    box-shadow: 0 0 0 2px #d946ef;
                }

                .PhoneInputWrapper .PhoneInputCountry {
                    background-color: #1f2937; 
                    border: 1px solid #374151; 
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    border-radius: 0.5rem;
                    color: #d1d5db; 
                }
                .PhoneInputWrapper .PhoneInputCountrySelectItem {
                    padding: 0.5rem 0.75rem;
                }
                .PhoneInputWrapper .PhoneInputCountrySelectItem:hover {
                    background-color: #374151; 
                }
                .PhoneInputWrapper .PhoneInputCountrySelectItem--selected {
                    background-color: #4b5563; 
                }
            `}</style>

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
            <DashboardLayout>
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h2 className="text-3xl md:text-4xl font-bold">Profile</h2>
                    <p className="text-gray-400 mt-2">View and manage your account details.</p>
                </motion.header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 row-span-1 lg:row-span-2">
                        <ProfileAvatarCard 
                            user={userData.user}
                            onEditClick={() => setIsEditing(true)}
                            onFileChange={handleFileChange}
                            fileInputRef={fileInputRef}
                            isUploading={isUploading}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <ProfileDetailsCard
                            user={userData.user}
                            isEditing={isEditing}
                            formData={formData}
                            formErrors={formErrors}
                            onFormChange={handleFormChange}
                            onPhoneChange={handlePhoneChange}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                     <div className="lg:col-span-2">
                        <ProfileVerificationCard
                            user={userData.user}
                            formData={formData}
                            formErrors={formErrors}
                            onFormChange={handleFormChange}
                            onPhoneChange={handlePhoneChange}
                            onSendEmailVerification={handleSendEmailVerification}
                            isSendingEmail={isSendingEmail}
                            onSendSmsCode={handleSendSmsCode}
                            isSendingSms={isSendingSms}
                            onVerifySmsCode={handleVerifySmsCode}
                            isVerifyingSms={isVerifyingSms}
                            smsCode={smsCode}
                            setSmsCode={setSmsCode}
                            mobileVerificationSent={mobileVerificationSent}
                        />
                    </div>
                     <div className="lg:col-span-2 lg:col-start-2">
                        <ProfileSocialsCard
                            isEditing={isEditing}
                            formData={formData}
                            errors={formErrors} 
                            onFormChange={handleFormChange}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
}
