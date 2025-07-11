import { z } from "zod";

export const BriefSchema = z.object({
  url: z.string().url().optional(),
  briefName: z.string().min(2, { message: "Brief name must be at least 2 characters." }),
  brandName: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  productName: z.string().min(2, { message: "Product/Service name must be at least 2 characters." }),
  adObjective: z.string().min(1, { message: "Please select an ad objective." }),
  productDescription: z.string().max(500, { message: "Description must be 500 characters or less." }),
  usp: z.string().max(500, { message: "USP must be 500 characters or less." }),
  targetAudience: z.string().min(10, { message: "Please provide a detailed target audience description." }),
  toneOfVoice: z.string().min(1, { message: "Please select a tone of voice." }),
  customerAwarenessLevel: z.string().optional(),
  marketSophistication: z.string().optional(),
  productionLevel: z.string().optional(),
});
