import React, { useEffect, useState } from 'react';

interface SaleToastProps {
  message: string;
  amount: number;
  onDismiss: () => void;
}

const SaleToast: React.FC<SaleToastProps> = ({ message, amount, onDismiss }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 2700);
    const dismiss = setTimeout(onDismiss, 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(dismiss);
    };
  }, [onDismiss]);

  return (
    <div
      className={`sale-toast${exiting ? ' exiting' : ''}`}
      onClick={onDismiss}
    >
      ✓ {message} — ${amount.toFixed(2)}
    </div>
  );
};

export default SaleToast;
