'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { clearSessionClient } from '@/actions/localStorage';
import { Site, SiteStatus, Post, PostStatus, FirestoreTimestamp, UserData } from '@/utils/types/dashboard';
import toast, { Toaster } from 'react-hot-toast';

import {
    PlusIcon, SettingsIcon, EditIcon, EyeIcon, MoreHorizontalIcon,
    LayoutDashboardIcon, LayoutGridIcon, FileTextIcon, UserIcon, LogOutIcon, MenuIcon, XIcon, StarIcon, PencilIcon, MonitorPlayIcon, Loader2Icon,
    BarChart3Icon, Trash2Icon, SearchIcon
} from 'lucide-react';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
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
                        <a
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                pathname === item.href ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                            }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.label}</span>
                        </a>
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
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                            pathname === item.href ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'hover:bg-gray-800'
                                        }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item.icon}
                                        <span className="font-medium">{item.label}</span>
                                    </a>
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

const DashboardLayout = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
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

const DeletePostModal = ({ isOpen, onClose, post, onPostDeleted }) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!post || isSubmitting) return;

        setIsSubmitting(true);
        setError('');
        const toastId = toast.loading('Deleting post...');

        try {
            const token = localStorage.getItem("blogToken");
            const response = await fetch(`/api/posts/${post.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Failed to delete post.');
            }

            onPostDeleted(post.id, post.siteId);
            toast.success('Post deleted successfully!', { id: toastId });
            onClose();

        } catch (err) {
            setError(err.message);
            toast.error(err.message || 'Failed to delete post.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-xl font-bold text-red-400">Delete Post</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Are you sure you want to delete &quot;{post?.title}&quot;? This action cannot be undone.
                            </p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                {error && <p className="text-sm text-red-400">{error}</p>}
                            </div>
                            <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3 rounded-b-lg">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-sm font-semibold hover:bg-gray-600 transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
                                    Delete Post
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


const PostsPageActionDropdown = ({ post, onDelete }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);
    const router = useRouter();

    React.useEffect(() => {
        const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleEdit = () => router.push(`/creator-space/${post.siteId}/${post.id}`); 
    const handleView = () => window.open(`https://${post.siteSubdomain}.blog.io/posts/${post.slug || post.id}`, '_blank'); 
    const handleDelete = () => onDelete(post);

    const createAction = (handler) => () => {
        handler();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-gray-600 cursor-pointer"><MoreHorizontalIcon className="w-5 h-5" /></button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-40 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-10"
                    >
                        <ul className="py-1">
                            <li><button onClick={createAction(handleEdit)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-fuchsia-500/20"><EditIcon className="w-4 h-4" /> Edit</button></li>
                            {String(post.status).toLowerCase() === 'published' && (
                                <li><button onClick={createAction(handleView)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-fuchsia-500/20"><EyeIcon className="w-4 h-4" /> View Post</button></li>
                            )}
                            <li className="my-1"><div className="h-px bg-gray-600"></div></li>
                            <li><button onClick={createAction(handleDelete)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"><Trash2Icon className="w-4 h-4" /> Delete</button></li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FullPostsTable = ({ posts, onDelete }) => {
    const router = useRouter();
    const formatDate = (timestamp) => {
        if (timestamp && typeof timestamp._seconds === 'number') {
            return new Date(timestamp._seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        return "---";
    };

    const StatusBadge = ({ status }) => { 
        const isPublished = String(status || 'draft').toLowerCase() === 'published';
        return <span className={`capitalize text-xs font-medium px-2.5 py-0.5 rounded-full ${isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{status}</span>;
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg mt-6 overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-800 text-xs text-gray-400 uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3">Post Title</th>
                        <th scope="col" className="px-6 py-3">Site</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Views</th>
                        <th scope="col" className="px-6 py-3">Likes</th>
                        <th scope="col" className="px-6 py-3">Created</th>
                        <th scope="col" className="px-6 py-3">Last Updated</th>
                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map((post) => (
                        <tr key={post.id} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                            <td className="px-6 py-4">
                                <button 
                                    onClick={() => router.push(`/creator-space/${post.siteId}/${post.id}`)} 
                                    className="font-medium text-white text-left hover:underline cursor-pointer"
                                >
                                    {post.title || 'Untitled Post'}
                                </button>
                                {String(post.status).toLowerCase() === 'published' && post.slug && (
                                     <a href={`https://${post.siteSubdomain}.blog.io/posts/${post.slug}`} target="_blank" rel="noopener noreferrer" className="block text-fuchsia-400 text-xs hover:underline">{`/${post.slug}`}</a>
                                )}
                            </td>
                            <td className="px-6 py-4 text-gray-400">{post.siteTitle || post.siteSubdomain}</td>
                            <td className="px-6 py-4"><StatusBadge status={post.status} /></td>
                            <td className="px-6 py-4 text-white">{(post.stats?.views || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-white">{(post.stats?.likes || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-gray-400">{formatDate(post.createdAt)}</td>
                            <td className="px-6 py-4 text-gray-400">{formatDate(post.updatedAt)}</td>
                            <td className="px-6 py-4 text-right"><div className="flex justify-end">
                                <PostsPageActionDropdown 
                                    post={post} 
                                    onDelete={onDelete}
                                />
                            </div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const FilterControls = ({ searchQuery, setSearchQuery, filters, setFilters, sites }) => {
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 my-8">
            <div className="relative w-full md:w-1/2 lg:w-1/3">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="w-5 h-5 text-gray-500" />
                </span>
                <input
                    type="text"
                    placeholder="Search by post title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
                 <select
                    name="siteId"
                    value={filters.siteId}
                    onChange={handleFilterChange}
                    className="w-full md:w-auto bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                >
                    <option value="all">All Sites</option>
                    {sites.map(site => (
                         <option key={site.id} value={site.id}>{site.title}</option>
                    ))}
                </select>
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full md:w-auto bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
            </div>
        </div>
    );
};


const PostsSkeleton = () => {
    const SkeletonTable = () => (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg mt-6 overflow-x-auto">
            <table className="w-full text-sm text-left animate-pulse">
                <thead className="bg-gray-800 text-xs text-gray-400 uppercase">
                    <tr>
                        {Array.from({ length: 8 }).map((_, i) => <th key={i} scope="col" className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></th>)}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 7 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-700">
                            <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-full mb-2"></div><div className="h-3 bg-gray-700 rounded w-1/2"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
                            <td className="px-6 py-4"><div className="h-5 bg-gray-700 rounded-full w-20"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-12"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-12"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-24"></div></td>
                            <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-700 rounded-md ml-auto"></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <DashboardLayout>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-pulse">
                <div>
                    <div className="h-10 bg-gray-700 rounded w-48 mb-3"></div>
                    <div className="h-5 bg-gray-700 rounded w-80"></div>
                </div>
            </header>
             <div className="flex flex-col md:flex-row items-center justify-between gap-4 my-8 animate-pulse">
                <div className="h-11 bg-gray-700 rounded-lg w-full md:w-1/2 lg:w-1/3"></div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                     <div className="h-11 bg-gray-700 rounded-lg w-full md:w-36"></div>
                    <div className="h-11 bg-gray-700 rounded-lg w-full md:w-32"></div>
                </div>
            </div>
            <section>
                <SkeletonTable />
            </section>
        </DashboardLayout>
    );
};


export default function AllPostsPage() {
    const [userData, setUserData] = React.useState({ user: null, sites: [], posts: [], stats: {} }); 
    const [loading, setLoading] = React.useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedPost, setSelectedPost] = React.useState(null);
    const router = useRouter();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [filters, setFilters] = React.useState({ status: 'all', siteId: 'all' }); 

    React.useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const token = localStorage.getItem("blogToken");
                if (!token) { router.push('/login'); return; }
                const response = await fetch('/api/posts', { headers: { 'Authorization': `Bearer ${token}` } }); 
                if (!response.ok) { 
                    if (response.status === 401) {
                        clearSessionClient(); 
                        router.push('/login'); 
                    }
                    throw new Error('Failed to fetch posts'); 
                }
                const data = await response.json(); 
                setUserData(data);
            } catch (error) { 
                console.error(error); 
                toast.error('Failed to fetch your posts.');
            } finally { 
                setLoading(false); 
            }
        }
        fetchData();
    }, [router]);

    const openDeleteModal = (post) => {
        setSelectedPost(post);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSelectedPost(null);
        setIsDeleteModalOpen(false);
    };

    const handlePostDeleted = (postId) => {
        setUserData(prev => ({
            ...prev,
            posts: (prev.posts || []).filter(p => p.id !== postId),
        }));
    };

    const filteredPosts = React.useMemo(() => {
        if (!userData.posts) return [];

        return userData.posts.filter(post => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = post.title?.toLowerCase().includes(query);

            const matchesStatus =
                filters.status === 'all' ||
                String(post.status).toLowerCase() === filters.status;
            
            const matchesSite = 
                filters.siteId === 'all' || 
                post.siteId === filters.siteId;

            return matchesSearch && matchesStatus && matchesSite;
        });
    }, [userData.posts, searchQuery, filters]);


    if (loading) return <PostsSkeleton />;

    return (
        <>
            <Toaster 
                position="top-center"
                toastOptions={{
                    className: '',
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                }}
            />
            <DeletePostModal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} post={selectedPost} onPostDeleted={handlePostDeleted} />

            <DashboardLayout>
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
                >
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold">All Posts</h2>
                        <p className="text-gray-400 mt-2">Manage all your posts across different sites.</p>
                    </div>
                </motion.header>

                 <FilterControls
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filters={filters}
                    setFilters={setFilters}
                    sites={userData.sites || []} 
                />

                <section>
                    {userData.posts?.length > 0 ? (
                        filteredPosts.length > 0 ? (
                            <FullPostsTable
                                posts={filteredPosts}
                                onDelete={openDeleteModal}
                            />
                        ) : (
                            <div className="text-center py-12 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg mt-6">
                                <h4 className="text-xl font-semibold">No posts found</h4>
                                <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria.</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-12 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg mt-6">
                            <h4 className="text-xl font-semibold">No posts yet!</h4>
                        </div>
                    )}
                </section>
            </DashboardLayout>
        </>
    );
}