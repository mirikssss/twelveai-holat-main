import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, User, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type Step = 'info' | 'code';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const canContinue = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 9;

  const handleContinue = () => {
    if (!canContinue) return;
    setStep('code');
  };

  const handleCodeChange = (idx: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/\d/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    if (val && idx < 3) {
      codeRefs.current[idx + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  useEffect(() => {
    if (step === 'code') codeRefs.current[0]?.focus();
  }, [step]);

  const codeComplete = code.every((c) => c.length === 1);

  const handleVerify = () => {
    if (!codeComplete) return;
    setLoading(true);
    setTimeout(() => {
      const cleanPhone = phone.replace(/\D/g, '');
      login(name.trim(), cleanPhone);
      toast.success('Tizimga kirdingiz!');
      navigate('/');
    }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center bg-muted min-h-screen">
      <main className="w-full max-w-[480px] bg-background relative flex flex-col" style={{ minHeight: '100dvh' }}>
        {/* Header */}
        <div className="bg-primary px-5 pt-12 pb-8 rounded-b-[28px]">
          <button onClick={() => step === 'code' ? setStep('info') : navigate(-1)} className="mb-5 p-2 -ml-2 rounded-full bg-white/15 active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <motion.h1 key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-white mb-1">
            {step === 'info' ? 'Tizimga kirish' : 'Tasdiqlash kodi'}
          </motion.h1>
          <p className="text-sm text-white/70">
            {step === 'info'
              ? "Ism va telefon raqamingizni kiriting"
              : `+${phone.replace(/\D/g, '')} raqamiga kod yuborildi`}
          </p>
        </div>

        <div className="flex-1 px-5 pt-6">
          <AnimatePresence mode="wait">
            {step === 'info' ? (
              <motion.div key="info" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                <label className="block mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Ismingiz</span>
                  <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3.5">
                    <User className="w-5 h-5 text-muted-foreground shrink-0" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sardor"
                      className="bg-transparent border-none outline-none text-sm font-medium text-foreground w-full placeholder:text-muted-foreground/50"
                    />
                  </div>
                </label>

                <label className="block mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Telefon raqam</span>
                  <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3.5">
                    <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      type="tel"
                      className="bg-transparent border-none outline-none text-sm font-medium text-foreground w-full placeholder:text-muted-foreground/50"
                    />
                  </div>
                </label>

                <button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-transform ${
                    canContinue
                      ? 'bg-primary text-white active:scale-[0.97]'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  Davom etish
                </button>
              </motion.div>
            ) : (
              <motion.div key="code" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tasdiqlash kodi</span>
                </div>

                <div className="flex justify-center gap-3 mb-8">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { codeRefs.current[i] = el; }}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      type="tel"
                      maxLength={1}
                      className="w-14 h-16 text-center text-2xl font-bold bg-secondary rounded-2xl border-2 border-transparent focus:border-primary outline-none transition-colors text-foreground"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerify}
                  disabled={!codeComplete || loading}
                  className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-transform ${
                    codeComplete && !loading
                      ? 'bg-primary text-white active:scale-[0.97]'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Tasdiqlash
                </button>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Demo rejim: istalgan kodni kiriting
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
}
