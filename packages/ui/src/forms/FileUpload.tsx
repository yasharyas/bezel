import React, { useRef, useState } from 'react';
import { Upload, Eye, X, FileText } from 'lucide-react';

type FileUploadProps = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  mandatory?: boolean;
  accept?: string;
};

export function FileUpload({
  name,
  label,
  value,
  onChange,
  error,
  mandatory,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file.name);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setShowPreview(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-neutral-700">
        {label}
        {mandatory && <span className="text-red-500 ml-1">*</span>}
      </label>

      {!value ? (
        <div
          className={[
            'flex items-center gap-3 p-3 rounded-xl border border-dashed cursor-pointer',
            'transition-all duration-200 min-h-[48px]',
            error ? 'border-red-500' : 'border-neutral-300 hover:border-indigo-400',
          ].join(' ')}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        >
          <Upload className="w-5 h-5 text-neutral-400 flex-shrink-0" />
          <span className="text-sm text-neutral-500">Click to upload a file</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-neutral-300 bg-neutral-50">
          <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <span className="text-sm text-neutral-700 truncate flex-1">{value}</span>
          <div className="flex items-center gap-1">
            {previewUrl && (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="p-1.5 rounded-full hover:bg-neutral-200 transition-colors"
                title="Preview"
              >
                <Eye className="w-4 h-4 text-neutral-600" />
              </button>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-full hover:bg-neutral-200 transition-colors"
              title="Remove"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        onChange={handleChange}
        className="sr-only"
        accept={accept}
      />

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}

      {showPreview && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-4 max-w-lg w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-neutral-800">{value}</span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-full hover:bg-neutral-200 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            <img src={previewUrl} alt={value} className="w-full rounded-lg object-contain max-h-[60vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
