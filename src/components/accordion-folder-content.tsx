import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Flex } from "@radix-ui/themes";
import { Typography } from "./ui/typography";
import moment from "moment";
import { Chip } from "./ui/chip";
import { Camera, CameraIcon, Circle, Dot, EllipsisVertical, Image, ImagePlay, LucideCamera, Video } from "lucide-react";
import { Button } from "./ui/button";
import { Brand, Folder } from "@prisma/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";
import { useDispatch } from "@/store/hooks";
import { updateSelectedBrand, updateSelectedFolder } from "@/store/slices/xray";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function AccordionFolderContent({ brands, id, folder }: { brands: Brand[]; id: string; folder: Folder }) {
  const dispatch = useDispatch();

  // Helper function to get brand logo - simplified since API now provides it
  const getBrandLogo = (brand: any) => {
    // Use the logo provided by the API (which now extracts from Facebook data)
    if (brand.logo && !brand.logo.includes('placeholder') && !brand.logo.includes('freepik')) {
      return brand.logo;
    }
    
    // No logo found - will use Avatar fallback
    return null;
  };

  return (
    <Table>
      <TableHeader className="bg-gray-50">
        <TableRow>
          <TableHead className="lg:w-[300px]">Name</TableHead>
          <TableHead className="lg:w-[150px]">Date Since</TableHead>
          <TableHead className="lg:w-[300px]">Ads</TableHead>
          <TableHead className="lg:w-[250px]">Type</TableHead>
          <TableHead className="lg:w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {brands?.map((brand: any) => {
          const brandLogo = getBrandLogo(brand);
          
          return (
            <TableRow key={brand.id}>
              <TableCell>
                <Flex align={"center"} className="space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={brandLogo || undefined} alt={`${brand.name} logo`} />
                    <AvatarFallback className="text-xs">
                      {brand.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Flex direction={"column"}>
                    <Typography variant="title" className="text-sm">
                      {brand.name}
                    </Typography>
                    {/* <Typography variant="subtitle" className="text-sm">
                      {brand.url}
                    </Typography> */}
                  </Flex>
                </Flex>
              </TableCell>
              <TableCell>{moment(brand.createdAt).format("MMM DD, YYYY")}</TableCell>
              <TableCell className="space-x-2">
                <Chip variant="success" icon={<Dot size={70} />} iconPosition="left" label={`${brand.activeAds || 0} Active`} className="bg-opacity-30 " />
                <Chip
                  icon={<Dot size={70} />}
                  iconPosition="left"
                  variant="error"
                  label={`${brand.inActiveAds || 0} Inactive`}
                  className="bg-opacity-30 "
                />
              </TableCell>
              <TableCell>
                <Flex wrap="wrap" className="gap-2">
                  {[
                    { count: brand?.noOfVideoAds || 0, icon: <Video size={20} /> }, 
                    { count: brand?.noOfImageAds || 0, icon: <Image size={20} /> }, 
                    { count: brand?.noOfGifAds || 0, icon: <ImagePlay size={20} /> }
                  ].map((item: any, k: number) => {
                    return (
                      <Chip
                        key={k}
                        icon={item.icon}
                        iconPosition="left"
                        variant="default"
                        label={`${item.count}`}
                        className="bg-opacity-0 border rounded-md"
                      />
                    );
                  })}
                </Flex>
              </TableCell>
              <TableCell>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" onClick={() => dispatch(updateSelectedFolder(folder))}>
                      <EllipsisVertical size={15} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-20 p-1">
                    <Link href={`/x-ray/brand/${brand.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                      View
                    </Link>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
