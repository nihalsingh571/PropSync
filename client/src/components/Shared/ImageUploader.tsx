// client/src/components/Shared/ImageUploader.tsx
// Reusable drag-and-drop / click-to-upload image picker.
// Accepts up to `maxFiles` images, shows live previews, calls onUpload on submit.

import React, { useRef, useState, useCallback } from 'react';

interface ImageUploaderProps {
  maxFiles?: number;
  onUpload: (files: File[]) => Promise<void>;
  label?: string;
  hint?: string;
  loading?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  maxFiles = 5,
  onUpload,
  label = 'Upload Images',
  hint = 'JPG, PNG, GIF or WebP · Max 5 MB each',
  loading = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = Array.from(incoming)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, maxFiles - previews.length);

    const newPreviews = allowed.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, maxFiles));
    setDone(false);
  }, [maxFiles, previews.length]);

  const remove = (idx: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
    setDone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!previews.length || uploading) return;
    setUploading(true);
    try {
      await onUpload(previews.map(p => p.file));
      setDone(true);
      setPreviews([]);
    } catch (_) {
      /* parent toast handles error */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="img-uploader">
      {/* Drop zone */}
      <div
        className={`img-uploader__zone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload images drop zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
        <div className="img-uploader__icon">🖼️</div>
        <div className="img-uploader__prompt">{label}</div>
        <div className="img-uploader__hint">{hint}</div>
        {previews.length > 0 && (
          <div className="img-uploader__count">{previews.length}/{maxFiles} selected</div>
        )}
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="img-uploader__previews">
          {previews.map((p, i) => (
            <div key={p.url} className="img-uploader__thumb">
              <img src={p.url} alt={p.file.name} />
              <button
                type="button"
                className="img-uploader__remove"
                onClick={e => { e.stopPropagation(); remove(i); }}
                aria-label="Remove image"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {previews.length > 0 && (
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={uploading || loading}
          onClick={handleSubmit}
          style={{ marginTop: '0.5rem' }}
        >
          {uploading ? 'Uploading…' : `Upload ${previews.length} image${previews.length !== 1 ? 's' : ''}`}
        </button>
      )}
      {done && (
        <span style={{ color: '#10b981', fontSize: '0.82rem', marginTop: '0.4rem', display: 'block' }}>
          ✓ Images uploaded successfully
        </span>
      )}
    </div>
  );
};

export default ImageUploader;
