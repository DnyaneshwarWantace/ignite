import { toast } from 'sonner';

export const toastService = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
    });
  },
  error: (message: string) => {
    toast.error(message, {
      duration: 3000,
    });
  },
  info: (message: string) => {
    toast.info(message, {
      duration: 3000,
    });
  },
  warning: (message: string) => {
    toast.warning(message, {
      duration: 3000,
    });
  },
};

export const showToast = (message: string, options?: { variant?: 'success' | 'error' | 'info' | 'warning' }) => {
  const variant = options?.variant || 'info';
  toastService[variant](message);
}; 