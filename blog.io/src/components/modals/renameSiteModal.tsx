import { Site } from "@/utils/types/dashboard";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const RenameSiteModal = ({ isOpen, onClose, site, onSiteRenamed }: {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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