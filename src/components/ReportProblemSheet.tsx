import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Send, Droplets, Zap, Wifi, ShieldAlert, Wrench, HelpCircle, Users, Stethoscope } from 'lucide-react';
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
  onClose: () => void;
}

export default function ReportProblemSheet({ objectName, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!selectedCategory) {
      toast.error("Kategoriyani tanlang");
      return;
    }
    toast.success("Xabar yuborildi!", { description: `${objectName} — ${selectedCategory}` });
    onClose();
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: "15%" }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-background rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] overflow-y-auto"
    >
      <div className="sticky top-0 bg-background z-10 pt-2 pb-1 px-6 rounded-t-[28px]">
        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
      </div>

      <div className="px-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Muammo haqida xabar</h2>
          <button onClick={onClose} className="p-2 bg-secondary rounded-full active:scale-90 transition-transform">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4">Kategoriyani tanlang:</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                selectedCategory === cat.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-foreground'
              }`}
            >
              <cat.icon className="w-4 h-4 shrink-0" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Photo placeholder */}
        <button className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 mb-4 active:bg-secondary transition-colors">
          <Camera className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Rasm qo'shish</span>
        </button>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Muammo haqida batafsil yozing..."
          rows={3}
          className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none placeholder:text-muted-foreground mb-4 border border-border/50 focus:border-primary/30 transition-colors"
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-md"
        >
          <Send className="w-4 h-4" />
          Yuborish
        </button>
      </div>
    </motion.div>
  );
}
