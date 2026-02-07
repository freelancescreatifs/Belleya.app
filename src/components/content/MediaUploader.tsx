import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Video, GripVertical } from 'lucide-react';
import { MediaFile, createFilePreview, revokeFilePreview, isVideoFile, isImageFile, validateMediaFile } from '../../lib/mediaHelpers';

interface MediaUploaderProps {
  mediaFiles: MediaFile[];
  onMediaFilesChange: (files: MediaFile[]) => void;
  maxFiles?: number;
}

export default function MediaUploader({ mediaFiles, onMediaFilesChange, maxFiles = 10 }: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      mediaFiles.forEach(media => {
        if (media.preview.startsWith('blob:')) {
          revokeFilePreview(media.preview);
        }
      });
    };
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }

  function addFiles(files: File[]) {
    const validFiles: MediaFile[] = [];

    for (const file of files) {
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }

      if (mediaFiles.length + validFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} fichiers autorisés`);
        break;
      }

      const hasVideo = validFiles.some(f => f.type === 'video') || mediaFiles.some(f => f.type === 'video');
      if (hasVideo && isVideoFile(file)) {
        alert('Une seule vidéo autorisée par contenu');
        continue;
      }

      if (isVideoFile(file) && (mediaFiles.length > 0 || validFiles.length > 0)) {
        alert('Impossible de mélanger vidéo et images');
        continue;
      }

      if ((mediaFiles.length > 0 || validFiles.length > 0) && mediaFiles.some(f => f.type === 'video')) {
        alert('Impossible de mélanger vidéo et images');
        continue;
      }

      validFiles.push({
        file,
        preview: createFilePreview(file),
        type: isVideoFile(file) ? 'video' : 'image'
      });
    }

    onMediaFilesChange([...mediaFiles, ...validFiles]);
  }

  function removeFile(index: number) {
    const newFiles = [...mediaFiles];
    const removed = newFiles.splice(index, 1)[0];
    if (removed.preview.startsWith('blob:')) {
      revokeFilePreview(removed.preview);
    }
    onMediaFilesChange(newFiles);
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...mediaFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);

    setDraggedIndex(index);
    onMediaFilesChange(newFiles);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  const hasVideo = mediaFiles.some(f => f.type === 'video');

  return (
    <div className="space-y-4">
      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {mediaFiles.map((media, index) => (
            <div
              key={index}
              draggable={!hasVideo}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-xl overflow-hidden border-2 border-gray-200 ${
                !hasVideo ? 'cursor-move' : ''
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {media.type === 'video' ? (
                <div className="aspect-video bg-gray-900">
                  <video
                    src={media.preview}
                    className="w-full h-full object-cover"
                    controls
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gray-100">
                  <img
                    src={media.preview}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {!hasVideo && mediaFiles.length > 1 && (
                <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  {index + 1}/{mediaFiles.length}
                </div>
              )}

              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                {media.type === 'video' ? (
                  <>
                    <Video className="w-3 h-3" />
                    Vidéo
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3 h-3" />
                    Image
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {mediaFiles.length < maxFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">
            {mediaFiles.length === 0
              ? 'Cliquez ou glissez vos médias ici'
              : 'Ajouter plus de médias'}
          </p>
          <p className="text-sm text-gray-500">
            {hasVideo
              ? 'Une seule vidéo par contenu'
              : `Images (JPEG, PNG, GIF, WebP) ou Vidéos (MP4, MOV, WebM) - Max ${maxFiles} fichiers`}
          </p>
          <p className="text-xs text-gray-400 mt-2">Max 50MB par fichier</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
            multiple={!hasVideo}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {mediaFiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            {hasVideo ? (
              <>
                <strong>Reel détecté</strong> - Une vidéo sera affichée dans le feed Instagram
              </>
            ) : mediaFiles.length > 1 ? (
              <>
                <strong>Carrousel détecté</strong> - {mediaFiles.length} images seront affichées
                {mediaFiles.length > 1 && ' (glissez pour réorganiser)'}
              </>
            ) : (
              <>
                <strong>Post simple détecté</strong> - Une image sera affichée dans le feed Instagram
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
