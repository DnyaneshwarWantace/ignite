import { ReactNode } from "react";
import { Typography } from "./ui/typography";
import { Button } from "./ui/button";
import { Play } from "lucide-react";
import Link from "next/link";

interface Props {
  title: string;
  subtitle: string;
  link: string;
  btnComp: ReactNode;
}

export default function CommonTopbar({ title, subtitle, link, btnComp }: Props) {
  return (
    <>
      <div className="flex-1 flex-col items-start ">
        <Typography variant="title">{title}</Typography>
        <Typography variant="subtitle">{subtitle}</Typography>
      </div>
      <div className="flex items-center space-x-5">
        <Link href={link} className="flex ">
          <Play size={20} />
          <Typography variant="subtitle">Tutorial</Typography>
        </Link>

        {btnComp}
      </div>
    </>
  );
}
