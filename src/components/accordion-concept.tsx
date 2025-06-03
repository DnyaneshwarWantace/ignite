"use client";

import { AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Typography } from "./ui/typography";
import moment from "moment";
import { Flex, Grid } from "@radix-ui/themes";
import { Folder } from "@prisma/client";

export default function AccordionConcept({ children, id, name }: { id: number; name: String } & { children: React.ReactNode }) {
  return (
    <AccordionItem className="border rounded-lg mb-2 px-2" key={id} value={id.toString()}>
      <AccordionTrigger className="hover:no-underline ">
        <Typography variant="title" className="font-medium text-sm">
          {name}
        </Typography>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}
