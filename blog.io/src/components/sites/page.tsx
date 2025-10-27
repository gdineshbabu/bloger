'use client';

import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { clearSessionClient } from '@/actions/localStorage';
import { Site, SiteStatus, FirestoreTimestamp, UserData } from '@/utils/types/dashboard';
import toast, { Toaster } from 'react-hot-toast';

import {
    PlusIcon, SettingsIcon, EditIcon, EyeIcon, MoreHorizontalIcon,
    LayoutDashboardIcon, LayoutGridIcon, FileTextIcon, UserIcon, LogOutIcon, MenuIcon, XIcon, StarIcon, PencilIcon, MonitorPlayIcon, Loader2Icon,
    BarChart3Icon, Trash2Icon, SearchIcon
} from 'lucide-react';
import { CreateSiteModal } from '../dashboard/modal';

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

const RenameSiteModal = ({ isOpen, onClose, site, onSiteRenamed }: {
    isOpen: boolean,
    onClose: () => void,
    site: Site | null,
    onSiteRenamed: (updatedSite: Site) => void
}) => {
    const [newTitle, setNewTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (site) {
            setNewTitle(site.title);
            setError('');
        }
    }, [site]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!site || newTitle === site.title || isSubmitting) return;

        setIsSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem("blogToken");
            const response = await fetch(`/api/sites/${site.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Failed to rename site.');
            }

            const updatedSite: Site = await response.json();
            onSiteRenamed(updatedSite);
            onClose();

        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Failed to rename site.');
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
                        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-xl font-bold text-white">Rename Site</h3>
                            <p className="text-sm text-gray-400 mt-1">Change the title for &quot;{site?.title}&quot;.</p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-300 mb-2">Site Title</label>
                                    <input
                                        type="text"
                                        id="siteTitle"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                        placeholder="My Awesome Blog"
                                    />
                                </div>
                                {error && <p className="text-sm text-red-400">{error}</p>}
                            </div>
                            <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3 rounded-b-lg">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-sm font-semibold hover:bg-gray-600 transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || newTitle === site?.title || !newTitle}
                                    className="px-4 py-2 rounded-lg bg-fuchsia-600 text-sm font-semibold hover:bg-fuchsia-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white cursor-pointer"
                                >
                                    {isSubmitting && <Loader2Icon className="w-4 h-4 animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const DeleteSiteModal = ({ isOpen, onClose, site, onSiteDeleted }: {
    isOpen: boolean,
    onClose: () => void,
    site: Site | null,
    onSiteDeleted: (siteId: string) => void
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!site || isSubmitting) return;

        setIsSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem("blogToken");
            const response = await fetch(`/api/sites/${site.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Failed to delete site.');
            }

            onSiteDeleted(site.id);
            onClose();

        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Failed to delete site.');
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
                            <h3 className="text-xl font-bold text-red-400">Delete Site</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Are you sure you want to delete &quot;{site?.title}&quot;? This action is permanent and cannot be undone.
                            </p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                {error && <p className="text-sm text-red-400">{error}</p>}
                                {!error && <p className="text-sm text-gray-400">This will delete all posts, analytics, and settings associated with this site.</p>}
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
                                    Delete Site
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


const SitesPageActionDropdown = ({ site, onRename, onStatusChange, onDelete }: {
    site: Site,
    onRename: (site: Site) => void,
    onStatusChange: (siteId: string, newStatus: SiteStatus) => void,
    onDelete: (site: Site) => void,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleEdit = () => router.push(`/creator-space/${site.id}`);
    const handleView = () => window.open(`https://${site.subdomain}.blog.io`, '_blank');
    const handleSettings = () => router.push(`/site/${site.id}/settings`);
    const handleLivePreview = () => router.push(`/live-preview/${site.id}`);
    const handleAnalytics = () => router.push(`/analytics/${site.id}`);
    const handleUnpublish = () => onStatusChange(site.id, 'draft');
    const handleDelete = () => onDelete(site);

    const createAction = (handler: () => void) => () => {
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
                        className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-10"
                    >
                        <ul className="py-1">
                            <li><button onClick={createAction(handleEdit)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-fuchsia-500/20"><EditIcon className="w-4 h-4" /> Edit</button></li>
                            {String(site.status).toLowerCase() === 'published' && (
                                <li><button onClick={createAction(handleView)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-fuchsia-500/20"><EyeIcon className="w-4 h-4" /> View Site</button></li>
                            )}
                            <li><button onClick={createAction(handleAnalytics)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-fuchsia-500/20"><BarChart3Icon className="w-4 h-4" /> Analytics</button></li>
                            <li><button onClick={createAction(handleLivePreview)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-fuchsia-500/20"><MonitorPlayIcon className="w-4 h-4" /> Live Preview</button></li>
                            <li><button onClick={createAction(() => onRename(site))} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-fuchsia-500/20"><PencilIcon className="w-4 h-4" /> Rename</button></li>
                            {String(site.status).toLowerCase() === 'published' && (
                                <li><button onClick={createAction(handleUnpublish)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-fuchsia-500/20"><XIcon className="w-4 h-4" /> Unpublish</button></li>
                            )}
                            <li className="my-1"><div className="h-px bg-gray-600"></div></li>
                            <li><button onClick={createAction(handleSettings)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-fuchsia-500/20"><SettingsIcon className="w-4 h-4" /> Settings</button></li>
                            <li><button onClick={createAction(handleDelete)} className="w-full cursor-pointer text-left flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"><Trash2Icon className="w-4 h-4" /> Delete</button></li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FullSitesTable = ({ sites, onRename, onToggleFavourite, onStatusChange, onDelete }: {
    sites: Site[],
    onRename: (site: Site) => void,
    onToggleFavourite: (siteId: string, currentStatus: boolean) => void,
    onStatusChange: (siteId: string, newStatus: SiteStatus) => void,
    onDelete: (site: Site) => void,
}) => {
    const router = useRouter();
    const formatDate = (timestamp: FirestoreTimestamp) => {
        if (timestamp && typeof timestamp._seconds === 'number') {
            return new Date(timestamp._seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        return "---";
    };

    const StatusBadge = ({ status }: { status: SiteStatus }) => {
        const isPublished = String(status || 'draft').toLowerCase() === 'published';
        return <span className={`capitalize text-xs font-medium px-2.5 py-0.5 rounded-full ${isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{status}</span>;
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg mt-6 overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-800 text-xs text-gray-400 uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3 w-12">Fav</th>
                        <th scope="col" className="px-6 py-3">Site Title</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Views</th>
                        <th scope="col" className="px-6 py-3">Likes</th>
                        <th scope="col" className="px-6 py-3">Created</th>
                        <th scope="col" className="px-6 py-3">Last Published</th>
                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sites.map((site) => (
                        <tr key={site.id} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                            <td className="px-6 py-4">
                                <button onClick={() => onToggleFavourite(site.id, site.isFavourite || false)} className="text-gray-600 cursor-pointer hover:text-yellow-400">
                                    <StarIcon className={`w-5 h-5 ${site.isFavourite ? 'fill-yellow-400 text-yellow-400' : 'hover:text-gray-400'}`} />
                                </button>
                            </td>
                            <td className="px-6 py-4">
                                <button 
                                    onClick={() => router.push(`/creator-space/${site.id}`)} 
                                    className="font-medium text-white text-left hover:underline cursor-pointer"
                                >
                                    {site.title}
                                </button>
                                {String(site.status).toLowerCase() === 'published' ? (
                                    <a href={`https://${site.subdomain}.blog.io`} target="_blank" rel="noopener noreferrer" className="block text-fuchsia-400 text-xs hover:underline">{site.subdomain}.blog.io</a>
                                ) : (
                                    <span className="block text-gray-500 text-xs">{site.subdomain}.blog.io</span>
                                )}
                            </td>
                            <td className="px-6 py-4"><StatusBadge status={site.status} /></td>
                            <td className="px-6 py-4 text-white">{(site.stats?.views || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-white">{(site.stats?.likes || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-gray-400">{formatDate(site.createdAt)}</td>
                            <td className="px-6 py-4 text-gray-400">{formatDate(site.lastPublishedAt)}</td>
                            <td className="px-6 py-4 text-right"><div className="flex justify-end">
                                <SitesPageActionDropdown 
                                    site={site} 
                                    onRename={onRename} 
                                    onStatusChange={onStatusChange}
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

const StatCard = ({ title, value }: { title: string, value: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-xl relative overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/70 to-fuchsia-900/10 opacity-70 rounded-lg"></div>
        <p className="text-gray-400 text-sm relative z-10">{title}</p>
        <p className="text-3xl font-bold mt-1 relative z-10 text-white">{value.toLocaleString()}</p>
    </motion.div>
);

const FilterControls = ({ searchQuery, setSearchQuery, filters, setFilters, sortBy, setSortBy }: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filters: { status: string; isFavourite: string; };
    setFilters: React.Dispatch<React.SetStateAction<{ status: string; isFavourite: string; }>>;
    sortBy: string;
    setSortBy: (sort: string) => void;
}) => {
    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 my-8">
            <div className="relative w-full md:flex-grow">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="w-5 h-5 text-gray-500" />
                </span>
                <input
                    type="text"
                    placeholder="Search by title or subdomain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full sm:w-auto bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
                <select
                    name="isFavourite"
                    value={filters.isFavourite}
                    onChange={handleFilterChange}
                    className="w-full sm:w-auto bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                >
                    <option value="all">All Favourites</option>
                    <option value="yes">Favourites Only</option>
                    <option value="no">Not Favourites</option>
                </select>
                <select
                    name="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-auto bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                >
                    <option value="createdAt_desc">Newest First</option>
                    <option value="createdAt_asc">Oldest First</option>
                    <option value="lastPublishedAt_desc">Last Published</option>
                    <option value="title_asc">Title (A-Z)</option>
                    <option value="views_desc">Most Views</option>
                    <option value="likes_desc">Most Likes</option>
                </select>
            </div>
        </div>
    );
};


const SitesSkeleton = () => {
    const SkeletonTable = () => (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg mt-6 overflow-x-auto">
            <table className="w-full text-sm text-left animate-pulse">
                <thead className="bg-gray-800 text-xs text-gray-400 uppercase">
                    <tr>
                        {Array.from({ length: 8 }).map((_, i) => <th key={i} scope="col" className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-3/4"></div></th>)}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-700">
                            <td className="px-6 py-4"><div className="h-5 w-5 bg-gray-700 rounded-full"></div></td>
                            <td className="px-6 py-4"><div className="h-4 bg-gray-700 rounded w-full mb-2"></div><div className="h-3 bg-gray-700 rounded w-1/2"></div></td>
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
    const SkeletonCard = () => <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-pulse"><div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div><div className="h-8 bg-gray-700 rounded w-1/2"></div></div>;


    return (
        <DashboardLayout>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-pulse">
                <div>
                    <div className="h-10 bg-gray-700 rounded w-48 mb-3"></div>
                    <div className="h-5 bg-gray-700 rounded w-80"></div>
                </div>
                <div className="h-10 w-40 bg-gray-700 rounded-lg"></div>
            </header>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 my-8 animate-pulse">
                <div className="h-11 bg-gray-700 rounded-lg w-full md:w-1/2 lg:w-1/3"></div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="h-11 bg-gray-700 rounded-lg w-full md:w-32"></div>
                    <div className="h-11 bg-gray-700 rounded-lg w-full md:w-36"></div>
                </div>
            </div>
            <section>
                <SkeletonTable />
            </section>
        </DashboardLayout>
    );
};

export default function SitesPage() {
    const [userData, setUserData] = useState<UserData>({ user: null, sites: [], recentPosts: [], stats: {} });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ status: 'all', isFavourite: 'all' });
    const [sortBy, setSortBy] = useState('createdAt_desc');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const token = localStorage.getItem("blogToken");
                if (!token) { router.push('/login'); return; }
                const response = await fetch('/api/sites', { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) { if (response.status === 401) clearSessionClient(); router.push('/login'); throw new Error('Failed to fetch data'); }
                const data: UserData = await response.json();
                setUserData(data);
            } catch (error) { 
                console.error(error); 
                toast.error('Failed to fetch your data.');
            } finally { 
                setLoading(false); 
            }
        }
        fetchData();
    }, [router]);

    const handleSiteCreated = (newSite: Site) => {
        setUserData((prevData) => ({
            ...prevData,
            sites: [newSite, ...(prevData.sites || [])],
            stats: { ...prevData.stats, totalSites: (prevData.stats.totalSites || 0) + 1 }
        }));
        toast.success('Site created successfully!');
    };

    const openRenameModal = (site: Site) => {
        setSelectedSite(site);
        setIsRenameModalOpen(true);
    };

    const closeRenameModal = () => {
        setSelectedSite(null);
        setIsRenameModalOpen(false);
    };

    const openDeleteModal = (site: Site) => {
        setSelectedSite(site);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSelectedSite(null);
        setIsDeleteModalOpen(false);
    };

    const handleSiteRenamed = (updatedSite: Site) => {
        setUserData(prev => ({
            ...prev,
            sites: (prev.sites || []).map(s => s.id === updatedSite.id ? updatedSite : s)
        }));
        closeRenameModal();
        toast.success('Site renamed successfully!');
    };

    const handleSiteDeleted = (siteId: string) => {
        setUserData(prev => ({
            ...prev,
            sites: (prev.sites || []).filter(s => s.id !== siteId),
            stats: { ...prev.stats, totalSites: (prev.stats.totalSites || 1) - 1 }
        }));
        closeDeleteModal();
        toast.success('Site deleted successfully!');
    };

    const handleStatusChange = async (siteId: string, newStatus: SiteStatus) => {
        const originalSites = userData.sites;
        setUserData(prev => ({
            ...prev,
            sites: (prev.sites || []).map(s => s.id === siteId ? { ...s, status: newStatus } : s)
        }));

        try {
            const token = localStorage.getItem("blogToken");
            const response = await fetch(`/api/sites/${siteId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update status');

            const updatedSite = await response.json();
            setUserData(prev => ({
                ...prev,
                sites: (prev.sites || []).map(s => s.id === siteId ? updatedSite : s)
            }));
            toast.success(newStatus === 'draft' ? 'Site unpublished.' : 'Site status updated.');
        } catch (error) {
            console.error(error);
            setUserData(prev => ({ ...prev, sites: originalSites }));
            toast.error('Failed to update status.');
        }
    };

    const handleToggleFavourite = async (siteId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        setUserData(prev => ({
            ...prev,
            sites: (prev.sites || []).map(s => s.id === siteId ? { ...s, isFavourite: newStatus } : s)
        }));

        try {
            const token = localStorage.getItem("blogToken");
            const response = await fetch(`/api/sites/${siteId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFavourite: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update favourite status');

            const updatedSite = await response.json();
            setUserData(prev => ({
                ...prev,
                sites: (prev.sites || []).map(s => s.id === siteId ? updatedSite : s)
            }));
            toast.success(newStatus ? 'Added to favourites!' : 'Removed from favourites.');
        } catch (error) {
            console.error(error);
            setUserData(prev => ({
                ...prev,
                sites: (prev.sites || []).map(s => s.id === siteId ? { ...s, isFavourite: currentStatus } : s)
            }));
            toast.error('Failed to update favourite.');
        }
    };

    const existingSubdomains = React.useMemo(() => (userData.sites || []).map(site => site.subdomain), [userData.sites]);

    const filteredAndSortedSites = React.useMemo(() => {
        if (!userData.sites) return [];

        let filtered = userData.sites.filter(site => {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                site.title.toLowerCase().includes(query) ||
                site.subdomain.toLowerCase().includes(query);

            const matchesStatus =
                filters.status === 'all' ||
                String(site.status).toLowerCase() === filters.status;

            const matchesFavourite =
                filters.isFavourite === 'all' ||
                (filters.isFavourite === 'yes' && site.isFavourite) ||
                (filters.isFavourite === 'no' && !site.isFavourite);

            return matchesSearch && matchesStatus && matchesFavourite;
        });

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                case 'views_desc':
                    return (b.stats?.views || 0) - (a.stats?.views || 0);
                case 'likes_desc':
                    return (b.stats?.likes || 0) - (a.stats?.likes || 0);
                case 'createdAt_asc':
                    return (a.createdAt?._seconds || 0) - (b.createdAt?._seconds || 0);
                case 'lastPublishedAt_desc':
                    return (b.lastPublishedAt?._seconds || 0) - (a.lastPublishedAt?._seconds || 0);
                case 'createdAt_desc':
                default:
                    return (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0);
            }
        });

        return filtered;

    }, [userData.sites, searchQuery, filters, sortBy]);


    if (loading) return <SitesSkeleton />;

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
            <CreateSiteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSiteCreated={handleSiteCreated} existingSubdomains={existingSubdomains} />
            <RenameSiteModal isOpen={isRenameModalOpen} onClose={closeRenameModal} site={selectedSite} onSiteRenamed={handleSiteRenamed} />
            <DeleteSiteModal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} site={selectedSite} onSiteDeleted={handleSiteDeleted} />

            <DashboardLayout>
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
                >
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold">My Sites</h2>
                        <p className="text-gray-400 mt-2">Manage all your sites, analytics, and settings.</p>
                    </div>
                    <motion.button
                        onClick={() => setIsModalOpen(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-fuchsia-500 hover:bg-fuchsia-600 flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" /> <span className="hidden sm:inline">Create New Site</span>
                    </motion.button>
                </motion.header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Sites" value={userData.stats?.totalSites || 0} />
                    <StatCard title="Total Likes" value={userData.stats?.totalLikes || 0} />
                    <StatCard title="Total Views" value={userData.stats?.totalViews || 0} />
                </div>

                <FilterControls
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filters={filters}
                    setFilters={setFilters}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />

                <section>
                    {userData.sites?.length > 0 ? (
                        filteredAndSortedSites.length > 0 ? (
                            <FullSitesTable
                                sites={filteredAndSortedSites}
                                onRename={openRenameModal}
                                onToggleFavourite={handleToggleFavourite}
                                onStatusChange={handleStatusChange}
                                onDelete={openDeleteModal}
                            />
                        ) : (
                            <div className="text-center py-12 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg mt-6">
                                <h4 className="text-xl font-semibold">No sites found</h4>
                                <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria.</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-12 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg mt-6">
                            <h4 className="text-xl font-semibold">No sites yet!</h4>
                            <p className="text-gray-400 mt-2">Click &quot;Create New Site&quot; to get started.</p>
                        </div>
                    )}
                </section>
            </DashboardLayout>
        </>
    );
}