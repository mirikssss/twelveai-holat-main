import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Map, BarChart3, User, Star, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useAuth();

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleProfileTap = () => {
    setOpen(false);
    navigate(isLoggedIn ? '/profile' : '/auth');
  };

  const navItems = [
    { path: '/', label: 'Xarita', icon: Map },
    { path: '/dashboard', label: 'Tahlil', icon: BarChart3 },
    ...(isLoggedIn ? [{ path: '/profile', label: 'Profilim', icon: FileText }] : []),
  ];

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-full h-full bg-background/95 backdrop-blur-md rounded-2xl shadow-md border border-border/50 active:scale-95 transition-transform"
        aria-label="Menyu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-[100]"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] max-w-[80vw] bg-background z-[101] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-base font-bold text-foreground">Menyu</span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary active:scale-95 transition-all"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <button onClick={handleProfileTap} className="p-4 border-b border-border text-left active:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    {initials ? (
                      <span className="text-sm font-bold text-primary">{initials}</span>
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {isLoggedIn ? user?.name : 'Kirish'}
                    </p>
                    {isLoggedIn ? (
                      <p className="text-xs text-muted-foreground">+{user?.phone}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Tizimga kirish uchun bosing</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </button>

              <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-semibold transition-colors active:scale-[0.97] ${
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">XalqBerdi v1.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
