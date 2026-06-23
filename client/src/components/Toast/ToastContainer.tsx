import React from 'react';
import '../Toast/Toast.css';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContainer: React.FC<{ toasts: ToastItem[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
          <div className="toast-message">{t.message}</div>
          <button className="toast-close">×</button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
