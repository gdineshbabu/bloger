
import { Site } from "@/utils/types/dashboard";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export const DeleteSiteModal = ({ isOpen, onClose, site, onSiteDeleted }: {
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