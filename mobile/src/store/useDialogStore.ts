import { create } from 'zustand';

export type DialogType = 'info' | 'success' | 'warning' | 'danger';

export interface DialogOptions {
  title: string;
  message?: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions | null;
  show: (options: DialogOptions) => void;
  hide: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  options: null,
  show: (options) => set({ isOpen: true, options }),
  hide: () => set({ isOpen: false, options: null }),
}));

export const AppAlert = {
  show: (title: string, message?: string, onConfirm?: () => void, confirmText = 'OK') => {
    useDialogStore.getState().show({
      title,
      message,
      type: 'info',
      confirmText,
      showCancel: false,
      onConfirm,
    });
  },
  warning: (title: string, message?: string, onConfirm?: () => void, confirmText = 'Got It') => {
    useDialogStore.getState().show({
      title,
      message,
      type: 'warning',
      confirmText,
      showCancel: false,
      onConfirm,
    });
  },
  success: (title: string, message?: string, onConfirm?: () => void, confirmText = 'Continue') => {
    useDialogStore.getState().show({
      title,
      message,
      type: 'success',
      confirmText,
      showCancel: false,
      onConfirm,
    });
  },
  error: (title: string, message?: string, onConfirm?: () => void, confirmText = 'Dismiss') => {
    useDialogStore.getState().show({
      title,
      message,
      type: 'danger',
      confirmText,
      showCancel: false,
      onConfirm,
    });
  },
  confirm: (options: {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    type?: DialogType;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => {
    useDialogStore.getState().show({
      ...options,
      showCancel: true,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'info',
    });
  },
};
