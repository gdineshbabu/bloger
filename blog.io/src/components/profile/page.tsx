'use client';

import React, { useState, useEffect, ReactNode, useRef, ChangeEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { clearSessionClient } from '@/actions/localStorage';
import { Site, SiteStatus, FirestoreTimestamp, UserData } from '@/utils/types/dashboard';
import toast, { Toaster } from 'react-hot-toast';

import {
    PlusIcon, SettingsIcon, EditIcon, EyeIcon, MoreHorizontalIcon,
    LayoutDashboardIcon, LayoutGridIcon, FileTextIcon, UserIcon, LogOutIcon, MenuIcon, XIcon,
    BarChart3Icon, StarIcon, PencilIcon, MonitorPlayIcon, Loader2Icon, Trash2Icon,
    MailIcon, CalendarIcon, SaveIcon, CameraIcon
} from 'lucide-react';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }: { isMobileMenuOpen: boolean; setIsMobileMenuOpen: (isOpen: boolean) => void; }) => {
    const router = useRouter();
    const pathname = usePathname();
    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboardIcon /> },
        { href: '/sites', label: 'My Sites', icon: <LayoutGridIcon /> },
        { href: '/posts', label: 'All Posts', icon: <FileTextIcon /> },
        { href: '/profile', label: 'Profile', icon: <UserIcon /> }
    ];

    const handleLogout = () => { clearSessionClient(); router.push('/login'); };

    return (
        <>
            <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white fixed h-full border-r border-gray-800 p-4">
                <div className="px-2 py-4 border-b border-gray-800 mb-4">
                    <h1 className="text-2xl font-bold">
                        blog<span className="text-fuchsia-400">.io</span>
                    </h1>
                </div>
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => router.push(item.href)}
                            className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                                pathname === item.href ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                            }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="border-t border-gray-800 pt-4 mt-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
                    >
                        <LogOutIcon />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <motion.aside
                            className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white border-r border-gray-800 p-4 flex flex-col"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-2 py-4 border-b border-gray-800 mb-4 flex justify-between items-center">
                                <h1 className="text-2xl font-bold">blog<span className="text-fuchsia-400">.io</span></h1>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <XIcon />
                                </button>
                            </div>
                            <nav className="flex-1 space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                            router.push(item.href);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                                            pathname === item.href ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                                        }`}
                                    >
                                        {item.icon}
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </nav>
                            <div className="border-t border-gray-800 pt-4 mt-4">
                                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400">
                                    <LogOutIcon />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </motion.aside>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans flex">
            <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
            <div className="flex-1 md:ml-64">
                <header className="md:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-md hover:bg-gray-800 text-gray-400">
                        <MenuIcon />
                    </button>
                    <h1 className="text-xl font-bold">blog<span className="text-fuchsia-400">.io</span></h1>
                    <div className="w-10"></div>
                </header>
                <main className="container mx-auto p-6 md:p-8">{children}</main>
            </div>
        </div>
    );
};

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

const ProfileInput = ({ label, id, value, onChange, disabled = false, type = 'text' }: {
    label: string,
    id: string,
    value: string,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    disabled?: boolean,
    type?: string
}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <input
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
    </div>
);

const ProfileAvatarCard = ({ user, onEditClick, onFileChange, fileInputRef, isUploading }: {
    user: UserData['user'],
    onEditClick: () => void,
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void,
    fileInputRef: React.RefObject<HTMLInputElement>,
    isUploading: boolean
}) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
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
        <div className="relative w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600 mb-6 overflow-hidden cursor-pointer">
            {user?.photoURL ? (
                <img key={user.photoURL} src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
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
            className="cursor-pointer mt-8 w-full bg-fuchsia-500 hover:bg-fuchsia-600 flex items-center justify-center gap-2 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
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
    onFormChange,
    onSave,
    onCancel,
    isSubmitting
}: {
    user: UserData['user'],
    isEditing: boolean,
    formData: any,
    onFormChange: (e: ChangeEvent<HTMLInputElement>) => void,
    onSave: (e: FormEvent<HTMLFormElement>) => void,
    onCancel: () => void,
    isSubmitting: boolean
}) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
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
                    />
                    <ProfileInput
                        label="Last Name"
                        id="lastName"
                        value={formData.lastName}
                        onChange={onFormChange}
                        disabled={!isEditing}
                    />
                </div>
                <ProfileInput
                    label="Email Address"
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={onFormChange}
                    disabled
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
                        className="cursor-pointer px-4 py-2 rounded-lg bg-fuchsia-600 text-sm font-semibold hover:bg-fuchsia-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 lg:p-8 animate-pulse">
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
                <div className="lg:col-span-1">
                    <SkeletonCard />
                </div>
                <div className="lg:col-span-2">
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
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: ''
    });
    const router = useRouter();

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
                
                const user: UserData['user'] = await response.json();
                
                setUserData({ user, sites: [], recentPosts: [], stats: {} }); 

                if (user) {
                    setFormData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '', 
                        email: user.email || '' 
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

            const updatedUser = await profileUpdateResponse.json();

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
    };

    const handleSave = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
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
                    lastName: formData.lastName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile.');
            }

            const updatedUser = await response.json();

            setUserData(prev => prev ? ({
                ...prev,
                user: {
                    ...prev.user,
                    ...updatedUser
                }
            }) : null);

            setFormData({
                firstName: updatedUser.firstName || '',
                lastName: updatedUser.lastName || '',
                email: updatedUser.email || ''
            });


            toast.success('Profile updated successfully!');
            setIsEditing(false);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to update profile.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCancel = () => {
        setIsEditing(false);
        if (userData?.user) {
            setFormData({
                firstName: userData.user.firstName || '',
                lastName: userData.user.lastName || '',
                email: userData.user.email || ''
            });
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
                    <div className="lg:col-span-1">
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