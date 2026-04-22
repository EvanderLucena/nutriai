import { create } from 'zustand';

interface ToastState {
  visible: boolean;
  message: string;
  showError: (msg?: string) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  visible: false,
  message: '',
  showError: (msg) =>
    set({ visible: true, message: msg || 'Erro ao salvar — tente novamente' }),
  hideToast: () => set({ visible: false, message: '' }),
}));