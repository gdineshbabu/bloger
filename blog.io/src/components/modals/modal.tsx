'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Site } from '@/utils/types/dashboard';

// --- ICONS ---
const PortfolioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><rect x="2" y="10" width="20" height="12" rx="2"/></svg>;
const BlogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h12"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

interface CreateSiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSiteCreated: (newSite: Site) => void; 
    existingSubdomains: string[];
}

export const CreateSiteModal: React.FC<CreateSiteModalProps> = ({ 
    isOpen, 
    onClose, 
    onSiteCreated, 
    existingSubdomains 
}) => {
    const [step, setStep] = useState(1);
    const [siteType, setSiteType] = useState<'portfolio' | 'blog' | null>(null);
    const [title, setTitle] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSelectType = (type: 'portfolio' | 'blog') => {
        setSiteType(type);
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const formattedSubdomain = subdomain.toLowerCase().trim();
        if (!formattedSubdomain) {
            setError('Subdomain cannot be empty.');
            return;
        }
        if (existingSubdomains.includes(formattedSubdomain)) {
            setError('This subdomain is already taken. Please choose another.');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("blogToken");
            const response = await fetch('/api/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, subdomain: formattedSubdomain, type: siteType, template: siteType === 'portfolio' ? 'Minimalist Folio' : 'Creative Writer' })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create site.');
            }
            onSiteCreated(data.site);
            handleClose();
        } catch (err: any) { 
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setStep(1);
            setSiteType(null);
            setTitle('');
            setSubdomain('');
            setError('');
        }, 300);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-800 text-white w-full max-w-2xl rounded-xl p-8 border border-gray-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Create a New Site</h2>
                            <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"><XIcon/></button>
                        </div>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                    <p className="text-gray-300 mb-8 text-lg">First, what kind of site would you like to build?</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <TypeCard icon={<PortfolioIcon />} title="Portfolio" description="Showcase your best work and projects." onClick={() => handleSelectType('portfolio')} />
                                        <TypeCard icon={<BlogIcon />} title="Blog" description="Share your stories, ideas, and expertise." onClick={() => handleSelectType('blog')} />
                                    </div>
                                </motion.div>
                            )}
                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <p className="text-gray-300 mb-8 text-lg">Great! Let&apos;s get some details for your new <span className="font-semibold text-fuchsia-400 capitalize">{siteType}</span>.</p>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">Site Title</label>
                                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., My Awesome Project" required className="w-full px-4 py-2.5 rounded-lg bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all" />
                                        </div>
                                        <div>
                                            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-300 mb-2">Subdomain</label>
                                            <div className="flex items-center">
                                                <input type="text" id="subdomain" value={subdomain} onChange={(e) => setSubdomain(e.target.value.replace(/[^a-z0-9-]/g, ''))} placeholder="your-unique-name" required className="w-full px-4 py-2.5 rounded-l-lg bg-gray-700/50 border-y border-l border-gray-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 z-10" />
                                                <span className="px-4 py-2.5 bg-gray-700 text-gray-400 rounded-r-lg border-y border-r border-gray-600">.blog.io</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Only letters, numbers, and hyphens are allowed.</p>
                                        </div>
                                        {error && <p className="text-red-400 text-sm font-medium pt-1">{error}</p>}
                                        <div className="flex justify-end items-center gap-4 pt-6">
                                            <button type="button" onClick={() => setStep(1)} className="text-gray-300 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-gray-700/50 transition-colors">Back</button>
                                            <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-fuchsia-500 hover:bg-fuchsia-600 disabled:bg-fuchsia-800 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded-lg transition-colors">{isLoading ? 'Creating...' : 'Create Site'}</motion.button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const TypeCard = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
    <motion.button onClick={onClick} whileHover={{ y: -4 }} className="p-6 bg-gray-900/50 rounded-lg border-2 border-gray-700 hover:border-fuchsia-500 text-left transition-colors flex items-center gap-4 w-full">
        <div className="text-fuchsia-400">{icon}</div>
        <div>
            <h4 className="font-bold text-white">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    </motion.button>
);