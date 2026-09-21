import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useContent, getByPath } from '../../context/ContentContext';
import { MediaPickerModal } from './MediaPickerModal';

interface EditableImageProps {
  path: string;
  className?: string;
  alt?: string;
  fallbackSrc?: string;
  /** Legacy aliases kept for backward compatibility with older pages. */
  defaultSrc?: string;
  src?: string;
  aspectRatio?: string;
}

export const EditableImage: React.FC<EditableImageProps> = ({
  path,
  className = '',
  alt = 'Image',
  fallbackSrc = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
}) => {
  const { data, isAdmin, updateField } = useContent();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentValue = getByPath(data, path) || fallbackSrc;

  if (!isAdmin) {
    return <img src={currentValue} alt={alt} className={className} referrerPolicy="no-referrer" />;
  }

  const handleSelectImage = (newUrl: string) => {
    updateField(path, newUrl);
  };

  return (
    <div className="relative group/img inline-block overflow-visible">
      <img src={currentValue} alt={alt} className={className} referrerPolicy="no-referrer" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsModalOpen(true);
        }}
        title="تغییر عکس (کتابخانه رسانه)"
        className="absolute top-2 right-2 z-40 bg-amber-400 text-slate-950 p-2 rounded-full shadow-xl opacity-0 group-hover/img:opacity-100 hover:scale-110 transition-all cursor-pointer flex items-center justify-center border border-slate-900"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <MediaPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectImage}
        currentUrl={currentValue}
      />
    </div>
  );
};

