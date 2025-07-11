import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 3000,
    });
  },
  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 3000,
    });
  },
  info: (message: string) => {
    sonnerToast.info(message, {
      duration: 3000,
    });
  },
  warning: (message: string) => {
    sonnerToast.warning(message, {
      duration: 3000,
    });
  },
};

export const showToast = (message: string, options?: { variant?: 'success' | 'error' | 'info' | 'warning' }) => {
  const variant = options?.variant || 'info';
  toast[variant](message);
}; 