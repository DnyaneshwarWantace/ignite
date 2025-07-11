import { Flex } from "@radix-ui/themes";
import React from "react";
import { Typography } from "./ui/typography";
import { ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Chip } from "./ui/chip";
import { timeDifferenceFromNow } from "@/lib/utils";
import moment from "moment";

interface Props {
  folder: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
  };
  name?: String;
  createdAt?: string;
  updatedAt?: Date;
}

export default function FolderNavigator({ folder, name, createdAt, updatedAt }: Props) {
  return (
    <Flex direction={"row"} align={"center"} className="gap-3">
      <Typography variant="subtitle" className="font-medium text-xs text-gray-900">
        {folder?.name}
      </Typography>
      <ChevronRight size={15} />
      <Button size={"sm"} variant="secondary" className="opacity-80  font-medium text-xs">
        {name}
      </Button>
      <Chip
        variant="default"
        className="bg-opacity-50 border text-gray-900 text-xs"
        label={`Updated ${updatedAt && timeDifferenceFromNow(updatedAt)} ago`}
      />
      <Chip
        variant="default"
        className="bg-opacity-50 border text-gray-900 text-xs"
        label={`Date since ${moment(createdAt).format("MMM DD, YYYY")}`}
      />
    </Flex>
  );
}
