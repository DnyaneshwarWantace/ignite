import { ReactNode } from "react";
import { Topbar } from "./topbar";

type Props = {
  top: ReactNode;
  bb?: Boolean;
  children: ReactNode;
};

export default function PageWrapper({ top, children, bb }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <Topbar content={top} bb={bb} />
      <main className="flex-1  p-4">{children}</main>
    </div>
  );
}
