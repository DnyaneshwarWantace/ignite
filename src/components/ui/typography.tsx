import { ReactNode } from "react";

// Extend the TypographyProps to handle title and subtitle variants
interface TypographyProps {
  variant: "title" | "subtitle" | "h1" | "h2" | "h3" | "p" | "blockquote" | "ul" | "table"; // Added title and subtitle
  children: ReactNode;
  className?: string; // Optional for any additional class overrides
}

export const Typography = ({ variant, children, className = "" }: TypographyProps) => {
  const baseClassNames = {
    title: "text-2xl font-bold leading-tight", // Styling for the title
    subtitle: "text-sm font-medium leading-relaxed text-muted-foreground", // Styling for the subtitle
    h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
    h2: "mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0",
    h3: "mt-8 scroll-m-20 text-2xl font-semibold tracking-tight",
    p: "leading-7 [&:not(:first-child)]:mt-6",
    blockquote: "mt-6 border-l-2 pl-6 italic",
    ul: "my-6 ml-6 list-disc [&>li]:mt-2",
    table: "my-6 w-full overflow-y-auto",
  };

  const Component = variant === "title" || variant === "subtitle" ? "div" : variant;

  return <Component className={`${baseClassNames[variant]} ${className}`}>{children}</Component>;
};
