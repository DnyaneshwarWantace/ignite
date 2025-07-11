import { Flex } from "@radix-ui/themes";
import React, { useEffect, useCallback } from "react";
import { InputWithIcon } from "./ui/input-with-icon";
import { CalendarIcon, Clock, EyeIcon, Languages, Search, Vault } from "lucide-react";
import AdvanceFilter from "./AdvanceFilter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { Typography } from "./ui/typography";
import { Calendar } from "./ui/calendar";
import { cn, useDebouncedFunction } from "@/lib/utils";

interface FilterRowProps {
  onSearchUpdate?: (v: string) => void;
  onFormatUpdate?: (v: string[]) => void;
  onPlatformUpdate?: (v: string[]) => void;
  onLanguageUpdate?: (v: string[]) => void;
  onNicheUpdate?: (v: string[]) => void;
  onStatusUpdate?: (v: string[]) => void;
  onDateUpdate?: (v: Date) => void;
  onSortUpdate?: (v: string) => void;
}

export default function FilterRow({
  onSearchUpdate,
  onDateUpdate,
  onFormatUpdate,
  onLanguageUpdate,
  onNicheUpdate,
  onPlatformUpdate,
  onSortUpdate,
  onStatusUpdate,
}: FilterRowProps) {
  const [date, setDate] = React.useState<Date>();
  const [search, setSearch] = React.useState<string>("");
  const [inputValue, setInputValue] = React.useState<string>("");
  const debouncedSearch = useDebouncedFunction((v: string) => setSearch(v), 300);

  // Stabilize callback functions to prevent infinite loops
  const handleFormatUpdate = useCallback((v: string[]) => {
    onFormatUpdate && onFormatUpdate(v);
  }, [onFormatUpdate]);

  const handlePlatformUpdate = useCallback((v: string[]) => {
    onPlatformUpdate && onPlatformUpdate(v);
  }, [onPlatformUpdate]);

  const handleStatusUpdate = useCallback((v: string[]) => {
    onStatusUpdate && onStatusUpdate(v);
  }, [onStatusUpdate]);

  const handleLanguageUpdate = useCallback((v: string[]) => {
    onLanguageUpdate && onLanguageUpdate(v);
  }, [onLanguageUpdate]);

  const handleNicheUpdate = useCallback((v: string[]) => {
    onNicheUpdate && onNicheUpdate(v);
  }, [onNicheUpdate]);

  const handleSortUpdate = useCallback((v: string) => {
    onSortUpdate && onSortUpdate(v);
  }, [onSortUpdate]);

  useEffect(() => {
    if (onSearchUpdate) {
      onSearchUpdate(search); // Always call, even with empty string
    }
  }, [search]); // Remove onSearchUpdate from dependencies to prevent infinite loop
  useEffect(() => {
    if (date && onDateUpdate) {
      onDateUpdate(date);
    }
  }, [date]);

  return (
    <Flex className="w-full" direction={"row"} justify={"between"} align={"center"}>
      <Flex gap={"1"}>
        <InputWithIcon
          placeholder="Search (min 3 chars for full search)"
          icon={<Search size={20} color="gray" />}
          iconPosition="left"
          value={inputValue}
          onChange={(e) => {
            const value = e.target.value;
            setInputValue(value);
            debouncedSearch(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Immediately trigger search on Enter
              const value = (e.target as HTMLInputElement).value;
              setSearch(value);
            }
          }}
        />

        <AdvanceFilter
          onChange={handleFormatUpdate}
          items={[{ title: "Video" }, { title: "Image" }, { title: "Carousal" }]}
          label="Format"
        />
        <AdvanceFilter
          onChange={handlePlatformUpdate}
          items={[
            { title: "Facebook" },
            { title: "Instagram" },
            { title: "TikTok Organic" },
            { title: "TikTok Ads" },
            { title: "Youtube" },
            { title: "LinkedIn" },
          ]}
          label="Platform"
        />
        <AdvanceFilter
          onChange={handleStatusUpdate}
          items={[
            { title: "Running" },
            { title: "Not Running" },
          ]}
          label="Status"
        />

        <AdvanceFilter
          onChange={handleLanguageUpdate}
          items={[
            { title: "English" },
            { title: "Spanish" },
            { title: "Chinese" },
            { title: "French" },
            { title: "Arabic" },
          ]}
          label="Language"
        />
        <AdvanceFilter
          onChange={handleNicheUpdate}
          items={[
            { title: "Accessories", icon: null, iconPosition: "left" },
            { title: "Alcohol", icon: null, iconPosition: "left" },
            { title: "App/Software", icon: null, iconPosition: "left" },
            { title: "Automotive", icon: null, iconPosition: "left" },
            { title: "Beauty", icon: null, iconPosition: "left" },
            { title: "Book/Publishing", icon: null, iconPosition: "left" },
            { title: "Business/Professional", icon: null, iconPosition: "left" },
            { title: "Charity/NFP", icon: null, iconPosition: "left" },
            { title: "Education", icon: null, iconPosition: "left" },
            { title: "Entertainment", icon: null, iconPosition: "left" },
            { title: "Fashion", icon: null, iconPosition: "left" },
          ]}
          label="Niche"
        />
      </Flex>

      <Flex className="gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className={cn("w-fit justify-start text-left font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                format(date, "PPP")
              ) : (
                <Typography variant="title" className="text-sm font-medium text-gray-700">
                  All Time
                </Typography>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
        <Select
          onValueChange={handleSortUpdate}
        >
          <SelectTrigger className="focus:ring-0 focus:ring-offset-0 w-fit gap-2">
            <SelectValue defaultValue={""} placeholder="Newest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="format">Format</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={"outline"} size={"icon"}>
          <EyeIcon size={20} />
        </Button>
      </Flex>
    </Flex>
  );
}
