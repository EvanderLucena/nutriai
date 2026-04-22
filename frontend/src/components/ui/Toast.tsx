import { useEffect, useState } from 'react';

interface ToastProps {
  visible: boolean;
  message?: string;
  onHide: () => void;
}

export function Toast({ visible, message = 'Erro ao salvar — tente novamente', onHide }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      // Trigger fade-in
      requestAnimationFrame(() => setShow(true));
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onHide, 200); // Wait for fade-out transition
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, onHide]);

  if (!visible && !show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        background: 'var(--surface)',
        border: '1px solid var(--coral)',
        padding: '12px 16px',
        borderRadius: 8,
        fontSize: 13,
        color: 'var(--fg)',
        opacity: show ? 1 : 0,
        transition: 'opacity 200ms ease-in-out',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {message}
    </div>
  );
}