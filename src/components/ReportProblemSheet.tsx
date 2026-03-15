import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Send, Droplets, Zap, Wifi, ShieldAlert, Wrench, HelpCircle, Users, Stethoscope, Loader2 } from 'lucide-react';
import { submitObservation, type VerificationError } from '@/api/mapApi';
import type { Observation } from '@/data/infrastructure';
import { toast } from 'sonner';

const CATEGORIES = [
  { key: 'Sanitariya', label: 'Sanitariya', icon: Stethoscope },
  { key: 'Suv', label: 'Suv', icon: Droplets },
  { key: 'Elektr', label: 'Elektr', icon: Zap },
  { key: 'Internet / Aloqa', label: 'Internet / Aloqa', icon: Wifi },
  { key: 'Navbat / Xizmat sifati', label: 'Navbat / Xizmat', icon: Users },
  { key: 'Xavfsizlik', label: 'Xavfsizlik', icon: ShieldAlert },
  { key: 'Infratuzilma', label: 'Infratuzilma', icon: Wrench },
  { key: 'Boshqa', label: 'Boshqa', icon: HelpCircle },
];

interface Props {
  objectName: string;
  objectId: number;
  onClose: () => void;
  onObservationAdded?: (obs: Observation) => void;
}

export default function ReportProblemSheet({ objectName, objectId, onClose, onObservationAdded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState(false);

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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError(true),
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

  const canSubmit = Boolean(
    selectedCategory &&
    capturedImage &&
    comment.trim().length > 0 &&
    userLocation &&
    !submitting
  );

  const handleSubmit = async () => {
    if (!selectedCategory) {
      toast.error("Kategoriyani tanlang");
      return;
    }
    if (!capturedImage) {
      toast.error("Rasm talab qilinadi");
      return;
    }
    if (!comment.trim()) {
      toast.error("Muammo haqida batafsil yozing");
      return;
    }
    if (!userLocation) {
      toast.error("Geolokatsiya aniqlanmadi");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const result = await submitObservation(objectId, {
        category: selectedCategory,
        text: comment.trim(),
        photo: capturedImage,
        userLocation,
      });

      toast.success(result.message, { description: `${objectName} — ${selectedCategory}` });

      if (onObservationAdded) {
        const obs: Observation = {
          id: result.observation.id,
          category: result.observation.category,
          text: result.observation.text,
          time: result.observation.timeLabel,
          photos: result.observation.photos,
          priority: result.observation.priority,
        };
        onObservationAdded(obs);
      }

      stream?.getTracks().forEach(t => t.stop());
      onClose();
    } catch (err) {
      const obsErr = err as VerificationError;
      if (obsErr.error === 'Too far from object') {
        toast.error(
          `Siz obyektdan ${obsErr.distanceToObjectMeters} m uzoqdasiz`,
          { description: obsErr.message }
        );
      } else {
        toast.error(obsErr.message || obsErr.error || "Xatolik yuz berdi");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    stream?.getTracks().forEach(t => t.stop());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Yopish"
        onClick={handleClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      {/* Form */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 flex flex-col bg-foreground rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.2)] overflow-hidden min-h-[88vh]"
      >
      {/* Header */}
      <div className="p-4 flex justify-between items-start shrink-0">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-background/60">Muammo haqida xabar</p>
          <h4 className="font-bold text-background text-sm mt-0.5">{objectName}</h4>
        </div>
        <button onClick={handleClose} className="p-2 bg-background/10 rounded-full">
          <X className="w-5 h-5 text-background" />
        </button>
      </div>

      {/* Geo warning */}
      {geoError && (
        <div className="mx-4 mb-2 px-3 py-2 bg-destructive/20 border border-destructive/30 rounded-xl">
          <p className="text-xs text-destructive font-medium">Geolokatsiya aniqlanmadi. Brauzer sozlamalaridan ruxsat bering.</p>
        </div>
      )}

      {/* Category */}
      <div className="px-4 pb-3 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-background/70 mb-2">Kategoriyani tanlang</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all active:scale-95 ${
                selectedCategory === cat.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background/15 text-background border border-background/20'
              }`}
            >
              <cat.icon className="w-3.5 h-3.5 shrink-0" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative mx-4 rounded-2xl overflow-hidden bg-foreground/80 flex items-center justify-center border border-background/10 min-h-[200px]">
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
                className="absolute bottom-4 z-10 w-14 h-14 border-4 border-background rounded-full flex items-center justify-center"
              >
                <div className="w-10 h-10 bg-background rounded-full active:scale-90 transition-transform" />
              </button>
            )}
          </>
        ) : (
          <>
            <img src={capturedImage} className="absolute inset-0 w-full h-full object-cover" alt="Captured" />
            <button
              onClick={retakePhoto}
              className="absolute top-3 right-3 z-10 bg-foreground/60 backdrop-blur-sm text-background text-xs font-bold px-3 py-1.5 rounded-full"
            >
              Qayta suratga olish
            </button>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Comment + Submit */}
      <div className="p-4 pb-8 shrink-0">
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Muammo haqida batafsil yozing... *"
          rows={2}
          className="w-full bg-background/10 border border-background/20 rounded-xl px-4 py-3 text-background text-sm outline-none resize-none placeholder:text-background/40 focus:border-background/40 mb-4"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-transform shadow-md ${
            canSubmit
              ? 'bg-primary text-primary-foreground active:scale-[0.97]'
              : 'bg-background/20 text-background/50 cursor-not-allowed'
          }`}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Yuborish
        </button>
      </div>
      </motion.div>
    </motion.div>
  );
}
