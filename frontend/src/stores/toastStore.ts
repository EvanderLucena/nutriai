import { create } from 'zustand';

interface ToastState {
  visible: boolean;
  message: string;
  type: 'error' | 'success';
  showError: (msg?: string) => void;
  showSuccess: (msg?: string) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  visible: false,
  message: '',
  type: 'error' as const,
  showError: (msg) =>
    set({ visible: true, message: msg || 'Erro ao salvar — tente novamente', type: 'error' }),
  showSuccess: (msg) =>
    set({ visible: true, message: msg || 'Salvo com sucesso', type: 'success' }),
  hideToast: () => set({ visible: false, message: '', type: 'error' }),
}));