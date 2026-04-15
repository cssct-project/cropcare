import React, { useRef, useEffect, useState } from 'react';
import { X, Scan, Loader2 } from 'lucide-react';

interface CameraModalProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  isProcessing: boolean;
}

export default function CameraModal({ onCapture, onClose, isProcessing }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        if (err.name === 'NotAllowedError' || err.message.includes('Permission denied')) {
          setError("Camera access was denied. Please allow camera permissions in your browser settings and try again.");
        } else if (err.name === 'NotFoundError' || err.message.includes('Requested device not found')) {
          setError("No camera found on your device. Please use the 'Upload Image' option instead.");
        } else {
          setError(`Could not access camera: ${err.message || 'Unknown error'}. Please check permissions.`);
        }
      }
    };
    startCamera();
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const srcStream = videoRef.current.srcObject as MediaStream;
        srcStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    // Set a timeout to close the camera after 30 seconds of inactivity
    const timeoutId = setTimeout(() => {
      if (!isProcessing) {
        alert("Camera closed due to inactivity.");
        onClose();
      }
    }, 30 * 1000); // 30 seconds

    return () => clearTimeout(timeoutId);
  }, [isProcessing, onClose]);

  const handleCapture = () => {
    if (videoRef.current && !isProcessing) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
            onCapture(file);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <h2 className="text-white font-bold text-lg">Scan Crop Leaf</h2>
        <button onClick={onClose} className="text-white p-2 bg-black/50 rounded-full hover:bg-black/70 transition">
          <X className="h-6 w-6" />
        </button>
      </div>
      
      {error ? (
        <div className="flex-1 flex items-center justify-center text-white p-6 text-center">
          <p>{error}</p>
        </div>
      ) : (
        <div className="flex-1 relative">
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          {/* Viewfinder overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl"></div>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent absolute bottom-0 left-0 right-0 flex flex-col items-center z-10">
        <p className="text-white/90 mb-6 text-center font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
          {isProcessing ? "Analyzing leaf..." : "Place the crop leaf in the frame and tap to scan"}
        </p>
        <button 
          onClick={handleCapture} 
          disabled={isProcessing || !!error}
          className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/50 disabled:opacity-50 transition-transform active:scale-95"
        >
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-green-600 shadow-lg">
            {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Scan className="h-8 w-8" />}
          </div>
        </button>
      </div>
    </div>
  );
}
