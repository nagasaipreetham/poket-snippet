import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel, onSave }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
    onSave(croppedImage, { crop, zoom });
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-xl h-[400px] bg-[#1e1e1e] rounded-t-xl overflow-hidden shadow-2xl border border-white/10">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={onZoomChange}
          cropShape="round"
          showGrid={false}
        />
      </div>

      <div className="w-full max-w-xl bg-[#252526] p-6 rounded-b-xl border-x border-b border-white/10 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-muted uppercase tracking-widest pl-1">Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent hover:accent-blue-400 transition-all"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-text-muted hover:text-white transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-accent hover:bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all"
          >
            Save Picture
          </button>
        </div>
      </div>
    </div>
  );
};

// Utils for creating the image from crop data
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set canvas size to match the bounding box
  canvas.width = image.width;
  canvas.height = image.height;

  // Draw image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped image using the pixelCrop coordinates
  // We create a new canvas for the final cropped output
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  // Resize canvas to the crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Paste data
  ctx.putImageData(data, 0, 0);

  // As a blob
  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, 'image/jpeg', 0.9); // High quality JPEG
  });
}

export default ImageCropper;
