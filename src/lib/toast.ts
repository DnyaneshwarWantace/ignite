import { toast as useToast } from "@/hooks/use-toast";

export const toast = {
  success: (message: string) => {
    useToast({
      title: "Success",
      description: message,
    });
  },
  error: (message: string) => {
    useToast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  },
  info: (message: string) => {
    useToast({
      title: "Info",
      description: message,
    });
  },
  warning: (message: string) => {
    useToast({
      title: "Warning",
      description: message,
      variant: "destructive",
    });
  },
};

export const showToast = (message: string, options?: { variant?: 'success' | 'error' | 'info' | 'warning' }) => {
  const variant = options?.variant || 'info';
  toast[variant](message);
}; 