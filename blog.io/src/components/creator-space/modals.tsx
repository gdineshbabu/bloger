import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";


export const SaveVersionModal = ({
    isOpen,
    onClose,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (versionName: string) => Promise<void>;
}) => {
    const [versionName, setVersionName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSaveClick = async () => {
        if (!versionName.trim()) return;
        setIsSaving(true);
        await onSave(versionName);
        setIsSaving(false);
        setVersionName(''); // Reset for next time
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md text-white border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Save New Version</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700" disabled={isSaving}><X size={20} /></button>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                    Give this version a descriptive name to easily identify it later.
                </p>
                <input
                    type="text"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder={`e.g., "Pre-launch design v2"`}
                    className="w-full bg-gray-700 rounded-md p-3 text-sm border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={isSaving}
                />
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors text-sm" disabled={isSaving}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveClick}
                        className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors text-sm flex items-center gap-2 disabled:bg-indigo-800 disabled:cursor-not-allowed"
                        disabled={isSaving || !versionName.trim()}
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {isSaving ? 'Saving...' : 'Save Version'}
                    </button>
                </div>
            </div>
        </div>
    );
};
SaveVersionModal.displayName = 'SaveVersionModal';

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
        <p className="text-gray-300 mb-6 text-sm">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 text-sm transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 text-sm transition-colors">Confirm</button>
        </div>
      </div>
    </div>
  );
};