// utils/toastUtils.ts
import { enqueueSnackbar, OptionsObject } from "notistack";

// Function to trigger a toast notification
export const showToast = (message: string, options: OptionsObject = {}) => {
  const snackID: any = enqueueSnackbar(message, {
    variant: "default", // You can set a default variant, e.g., "success", "error"

    ...options, // Spread any additional options passed to the function
  });
};
