'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CreateSiteModal } from '../modals/modal';
import { clearSessionClient } from '@/actions/localStorage';
import { Site, SiteStatus, FirestoreTimestamp, UserData } from '@/utils/types/dashboard';
import toast, { Toaster } from 'react-hot-toast';

import {
    PlusIcon, SettingsIcon, EditIcon, EyeIcon, MoreHorizontalIcon, XIcon,
    BarChart3Icon, StarIcon, PencilIcon, MonitorPlayIcon, Loader2Icon, Trash2Icon,
    SearchIcon, ListFilterIcon
} from 'lucide-react';
import { AnalyticsCharts } from './AnalyticsCharts';
import { DashboardLayout, DashboardSkeleton, StatCard } from '../loader/skeletonLoaders';
import { RenameSiteModal } from '../modals/renameSiteModal';
import { DeleteSiteModal } from '../modals/deleteSiteModal';

const ActionDropdown = ({ site, onRename, onStatusChange, onDelete }: { 
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

const SitesTable = ({ sites, onRename, onToggleFavourite, onStatusChange, onDelete }: { 
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
                        {/* --- MODIFIED COLUMNS --- */}
                        <th scope="col" className="px-6 py-3 hidden md:table-cell">Views</th>
                        <th scope="col" className="px-6 py-3 hidden md:table-cell">Likes</th>
                        <th scope="col" className="px-6 py-3 hidden md:table-cell">Created</th>
                        <th scope="col" className="px-6 py-3 hidden md:table-cell">Last Published</th>
                        {/* --- END MODIFIED COLUMNS --- */}
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
                            {/* --- MODIFIED COLUMNS --- */}
                            <td className="px-6 py-4 text-white hidden md:table-cell">{(site.stats?.views || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-white hidden md:table-cell">{(site.stats?.likes || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{formatDate(site.createdAt)}</td>
                            <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{formatDate(site.lastPublishedAt)}</td>
                            {/* --- END MODIFIED COLUMNS --- */}
                            <td className="px-6 py-4 text-right"><div className="flex justify-end">
                                <ActionDropdown 
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

const DashboardContent = ({ 
    userData, 
    displaySites,
    handleSiteCreated, 
    existingSubdomains, 
    setIsModalOpen, 
    onRename, 
    onToggleFavourite, 
    onStatusChange, 
    onDelete,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy
}: {
    userData: UserData,
    displaySites: Site[],
    handleSiteCreated: (newSite: Site) => void,
    existingSubdomains: string[],
    setIsModalOpen: (isOpen: boolean) => void,
    onRename: (site: Site) => void,
    onToggleFavourite: (siteId: string, currentStatus: boolean) => void,
    onStatusChange: (siteId: string, newStatus: SiteStatus) => void,
    onDelete: (site: Site) => void,
    searchTerm: string,
    setSearchTerm: (term: string) => void,
    filterStatus: string,
    setFilterStatus: (status: string) => void,
    sortBy: string,
    setSortBy: (sort: string) => void,
}) => {
    const router = useRouter();
    const hasSites = (userData.sites || []).length > 0;
    
    return (
        <>
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
            >
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold">Welcome back, {userData.user?.firstName || 'Creator'}! 👋</h2>
                    <p className="text-gray-400 mt-2">Here&apos;s a snapshot of your creative universe.</p>
                </div>
                <motion.button
                    onClick={() => setIsModalOpen(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer bg-fuchsia-500 hover:bg-fuchsia-600 flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="w-5 h-5" /> <span className="sm:inline">Create New Site</span>
                </motion.button>
            </motion.header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Sites" value={userData.stats?.totalSites || 0} />
                <StatCard title="Total Likes" value={userData.stats?.totalLikes || 0} />
                <StatCard title="Total Views" value={userData.stats?.totalViews || 0} />
            </div>

            <section className="mt-12">
                <div className="flex flex-row justify-between items-center mb-4 gap-4 flex-wrap">
                    <h3 className="text-2xl font-bold">My Sites</h3>
                    {hasSites && (
                        <button
                        onClick={() => router.push('/sites')}
                        className="cursor-pointer text-fuchsia-400 font-semibold py-2 px-4 rounded-lg hover:bg-fuchsia-500/10 transition-colors border border-fuchsia-500/30 text-sm md:text-base"
                        >
                        View All My Sites
                        </button>
                    )}
                </div>
                {hasSites ? (
                    <>
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="relative flex-grow">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <SearchIcon className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by title or subdomain..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="relative">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="cursor-pointer appearance-none w-full md:w-auto bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                    <ListFilterIcon className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="cursor-pointer appearance-none w-full md:w-auto bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                    >
                                        <option value="createdAt_desc">Newest First</option>
                                        <option value="createdAt_asc">Oldest First</option>
                                        <option value="lastPublishedAt_desc">Last Published</option>
                                        <option value="title_asc">Title (A-Z)</option>
                                        <option value="views_desc">Most Views</option>
                                        <option value="likes_desc">Most Likes</option>
                                    </select>
                                    <ListFilterIcon className="w-5 h-5 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {displaySites.length > 0 ? (
                            <SitesTable 
                                sites={displaySites.slice(0, 10)} 
                                onRename={onRename}
                                onToggleFavourite={onToggleFavourite}
                                onStatusChange={onStatusChange}
                                onDelete={onDelete}
                            />
                        ) : (
                            <div className="text-center py-12 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg mt-6">
                                <h4 className="text-xl font-semibold">No sites match!</h4>
                                <p className="text-gray-400 mt-2">Try adjusting your search or filter settings.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg mt-6">
                        <h4 className="text-xl font-semibold">No sites yet!</h4>
                        <p className="text-gray-400 mt-2">Click &quot;Create New Site&quot; to get started.</p>
                    </div>
                )}
            </section>

            <section className="mt-12">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3Icon className="text-fuchsia-400" />
                    <h3 className="text-2xl font-bold">Analytics</h3>
                </div>
                <AnalyticsCharts />
            </section>
        </>
    );
};

export default function DashboardPage() {
    const [userData, setUserData] = useState<UserData>({ user: null, sites: [], recentPosts: [], stats: {} });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');
    const router = useRouter();

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
            } catch (error) { console.error(error); } finally { setLoading(false); }
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
    };

    const handleSiteDeleted = (siteId: string) => {
        setUserData(prev => ({
            ...prev,
            sites: (prev.sites || []).filter(s => s.id !== siteId),
            stats: { ...prev.stats, totalSites: (prev.stats.totalSites || 1) - 1 }
        }));
        closeDeleteModal();
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
            toast.success(`Site ${newStatus === 'draft' ? 'unpublished' : 'published'}!`);
        } catch (error) {
            console.error(error);
            setUserData(prev => ({ ...prev, sites: originalSites }));
            toast.error('Failed to update site status.');
        }
    };

    const handleToggleFavourite = async (siteId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const originalSites = userData.sites;
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
            setUserData(prev => ({ ...prev, sites: originalSites }));
            toast.error('Failed to update favourite status.');
        }
    };

    const existingSubdomains = React.useMemo(() => (userData.sites || []).map(site => site.subdomain), [userData.sites]);

    const filteredAndSortedSites = React.useMemo(() => {
        if (!userData.sites) return [];

        const filtered = userData.sites
            .filter(site => {
            const searchMatch =
                site.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                site.subdomain.toLowerCase().includes(searchTerm.toLowerCase());

            const statusMatch =
                filterStatus === 'all' ||
                String(site.status).toLowerCase() === filterStatus;

            return searchMatch && statusMatch;
            })
            // =================================================================
            // START OF MODIFIED CODE
            // =================================================================
            .sort((a, b) => {
                // Primary sort: Favourites always come first
                if (a.isFavourite && !b.isFavourite) return -1;
                if (!a.isFavourite && b.isFavourite) return 1;

                // Secondary sort: Based on the user's selection in the dropdown
                // If both are favourites OR both are not, sort them by the selected criteria
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
                        // This is the default sort, which is newest first
                        return (b.createdAt?._seconds || 0) - (a.createdAt?._seconds || 0);
                }
            });
            // =================================================================
            // END OF MODIFIED CODE
            // =================================================================

        return filtered;
    }, [userData.sites, searchTerm, filterStatus, sortBy]);



    if (loading) return <DashboardSkeleton />;

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
            <CreateSiteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSiteCreated={handleSiteCreated} existingSubdomains={existingSubdomains} />
            <RenameSiteModal isOpen={isRenameModalOpen} onClose={closeRenameModal} site={selectedSite} onSiteRenamed={handleSiteRenamed} />
            <DeleteSiteModal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} site={selectedSite} onSiteDeleted={handleSiteDeleted} />
            
            <DashboardLayout>
                <DashboardContent
                    userData={userData}
                    displaySites={filteredAndSortedSites}
                    handleSiteCreated={handleSiteCreated}
                    existingSubdomains={existingSubdomains}
                    setIsModalOpen={setIsModalOpen}
                    onRename={openRenameModal}
                    onToggleFavourite={handleToggleFavourite}
                    onStatusChange={handleStatusChange}
                    onDelete={openDeleteModal}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />
            </DashboardLayout>
        </>
    );
}
