"use client";

import { AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Typography } from "./ui/typography";
import moment from "moment";
import { Flex, Grid } from "@radix-ui/themes";
import { Brand, Folder } from "@prisma/client";
import Link from "next/link";

export default function AccordionFolder({
  children,
  id,
  name,
  createdAt,
  userId,
  brands,
}: Folder & { children: React.ReactNode } & { brands: Brand[] }) {
  return (
    <AccordionItem className="[&:is(:last-child)]:border-0" key={id} value={id.toString()}>
      <AccordionTrigger className="hover:no-underline ">
        <Grid align={"center"} columns="3" rows="1">
          <Flex className="space-x-2" align={"center"}>
            <img src="/images/icons/folder.svg" className="w-[40px] h-[40px]" />
            <Typography variant="title" className=" text-sm hover:underline">
              <Link href={`/x-ray/brand/${id}`}>{name}</Link>
            </Typography>
          </Flex>
          <Typography variant="subtitle" className="font-medium text-sm">
            {brands.length} X-Rays
          </Typography>
          <Typography variant="subtitle" className="font-medium text-sm">
            Created On {moment(createdAt).format("MMM D, YYYY")}
          </Typography>
        </Grid>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}
