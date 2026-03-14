import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import type { InfraPromise } from '@/data/infrastructure';
import { toast } from 'sonner';

interface Props {
  promise: InfraPromise;
  onClose: () => void;
}

export default function CameraInspection({ promise, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [comment, setComment] = useState('');

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      toast.error("Kameraga ruxsat berilmadi");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const submit = (verdict: 'works' | 'broken') => {
    if (verdict === 'works') {
      toast.success('Ishlaydi deb belgilandi', { description: promise.title });
    } else {
      toast.error('Muammo bildirildi', { description: promise.title });
    }
    stream?.getTracks().forEach(t => t.stop());
    onClose();
  };

  const handleClose = () => {
    stream?.getTracks().forEach(t => t.stop());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 bg-foreground flex flex-col"
    >
      {/* Header */}
      <div className="p-5 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tekshirilmoqda</p>
          <h4 className="font-bold text-background text-sm">{promise.title}</h4>
        </div>
        <button onClick={handleClose} className="p-2 bg-background/10 rounded-full">
          <X className="w-5 h-5 text-background" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative mx-4 rounded-3xl overflow-hidden bg-foreground/80 flex items-center justify-center border border-background/10">
        {!capturedImage ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <Camera className="w-12 h-12 text-background/40" />
                <p className="text-background/40 text-sm font-medium">Kamera yuklanmoqda...</p>
              </div>
            )}
            {cameraReady && (
              <button
                onClick={takePhoto}
                className="absolute bottom-6 z-10 w-16 h-16 border-4 border-background rounded-full flex items-center justify-center"
              >
                <div className="w-12 h-12 bg-background rounded-full active:scale-90 transition-transform" />
              </button>
            )}
          </>
        ) : (
          <>
            <img src={capturedImage} className="absolute inset-0 w-full h-full object-cover" alt="Captured" />
            <button
              onClick={retakePhoto}
              className="absolute top-4 right-4 z-10 bg-foreground/60 backdrop-blur-sm text-background text-xs font-bold px-3 py-1.5 rounded-full"
            >
              Qayta suratga olish
            </button>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Actions */}
      <div className="p-5 pb-8">
        <div className="flex gap-3 mb-4">
          <button
            className="flex-1 bg-success text-success-foreground h-20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform font-bold"
            onClick={() => submit('works')}
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-sm">Ishlaydi ✓</span>
          </button>
          <button
            className="flex-1 bg-destructive text-destructive-foreground h-20 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform font-bold"
            onClick={() => submit('broken')}
          >
            <AlertCircle className="w-6 h-6" />
            <span className="text-sm">Buzilgan ✗</span>
          </button>
        </div>
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Ixtiyoriy: Nima muammo bor?"
          className="w-full bg-background/10 border border-background/20 rounded-xl px-4 py-3 text-background text-sm outline-none focus:border-background/40 placeholder:text-background/30"
        />
      </div>
    </motion.div>
  );
}
