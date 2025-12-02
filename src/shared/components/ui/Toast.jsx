import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'error', onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className="fixed top-24 right-4 z-[60] animate-in slide-in-from-right-10 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${styles[type]}`}>
        <div className="flex-shrink-0">{icons[type]}</div>
        <p className="text-sm font-medium pr-4">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}