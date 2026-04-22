import { useEffect, useState } from 'react';
import { useToastStore } from '../../stores/toastStore';

export function Toast() {
  const { visible, message, type, hideToast } = useToastStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setShow(true));
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(hideToast, 200);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, hideToast]);

  if (!visible && !show) return null;

  const isSuccess = type === 'success';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        background: 'var(--surface)',
        border: `1px solid ${isSuccess ? 'var(--sage)' : 'var(--coral)'}`,
        padding: '12px 16px',
        borderRadius: 8,
        fontSize: 13,
        color: 'var(--fg)',
        opacity: show ? 1 : 0,
        transition: 'opacity 200ms ease-in-out',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {message || (isSuccess ? 'Salvo com sucesso' : 'Erro ao salvar — tente novamente')}
    </div>
  );
}