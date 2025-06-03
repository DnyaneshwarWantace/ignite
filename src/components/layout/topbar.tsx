"use client";
interface TopbarProps {
  content: React.ReactNode;
  bb?: Boolean;
}

export function Topbar({ content, bb = false }: TopbarProps) {
  return <div className={"h-24  align-middle  bg-background flex items-center my-2 mx-4 py-4  " + (bb ? "border-b" : "")}>{content}</div>;
}
