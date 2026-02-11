import { ReactNode } from "react";
import { Typography } from "@/components/ui/typography";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  const hasTitleBlock = title || subtitle;
  if (!hasTitleBlock && !action) return null;
  return (
    <div className="flex items-center justify-between mb-6">
      {hasTitleBlock ? (
        <div className="flex flex-col">
          {title ? <Typography variant="title">{title}</Typography> : null}
          {subtitle ? <Typography variant="subtitle" className="mt-0.5">{subtitle}</Typography> : null}
        </div>
      ) : <div />}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
