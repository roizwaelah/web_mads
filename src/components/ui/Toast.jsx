import React, { useEffect } from 'react';
import { CheckCircle2, MessageCircleWarning } from 'lucide-react';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-10 right-6 z-100 pointer-events-none">
      <div className="bg-white border-l-4 border-[#2271b1] shadow-lg px-6 py-3 text-[13px] text-[#1d2327] flex items-center gap-3 animate-[bounceIn_0.3s_ease-out] pointer-events-auto rounded-r-sm">
        <MessageCircleWarning className="w-5 h-5 text-orange-500" />
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
