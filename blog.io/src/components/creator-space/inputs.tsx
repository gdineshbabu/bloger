
export interface StyleInputProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    options?: { label: string; value: string | number }[];
    placeholder?: string;
}

export const StyleInput = ({ label, value, onChange, type = 'text', options = [], ...props }: StyleInputProps) => (
  <div className="mb-2">
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    {type === 'select' ? (
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-700 rounded-md px-2 py-1 text-sm text-white">
        {options.map((opt) => <option key={opt.value.toString()} value={opt.value}>{opt.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-700 rounded-md px-2 py-1 text-sm text-white" {...props} />
    )}
  </div>
);
StyleInput.displayName = 'StyleInput';
