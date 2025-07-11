"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "./ui/checkbox";

type List = {
  title: string;
  icon?: React.ReactNode; // Make the icon optional
  iconPosition?: "left" | "right";
};

export default function AdvanceFilter({ items = [], label, onChange }: { items: List[]; label: string; onChange?: (v: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const hasInteracted = React.useRef(false);
  
  // Remove the useEffect that was causing the infinite loop
  // Only call onChange when user actually changes selection

  const handleSelectionChange = React.useCallback((itemTitle: string) => {
    hasInteracted.current = true;
    setSelected((prev: string[]) => {
      const newSelection = prev.includes(itemTitle) 
        ? prev.filter((i: string) => i !== itemTitle) 
        : [...prev, itemTitle];
      
      // Call onChange with the new selection only after user interaction
      if (onChange && hasInteracted.current) {
        onChange(newSelection);
    }
      
      return newSelection;
    });
  }, [onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="hover:bg-transparent border border-transparent data-[state=open]:border-primary rounded-xl">
        <Button variant="ghost" role="combobox" aria-expanded={open} className="w-fit max-w-[200px] justify-between ">
          {label}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1 ">
        <Command className="">
          <CommandList className="min-h-fit">
            {items.map((item, k) => (
              <CommandItem
                key={k}
                onSelect={() => {
                  hasInteracted.current = true;
                  if (item.icon) {
                    setSelected([item.title]);
                    if (onChange) {
                      onChange([item.title]);
                    }
                  } else {
                    handleSelectionChange(item.title);
                  }
                }}
                className="flex items-center mb-2 last:mb-0" // Ensure items align properly
              >
                {/* Render checkbox if no icon is provided */}
                {!item.icon && (
                  <Checkbox 
                    checked={Array.isArray(selected) && selected.includes(item.title)} 
                    className={cn("mr-2 h-4 w-4 border-gray-300")} 
                  />
                )}

                {/* Render icon if it exists, based on position */}
                {item.icon && item.iconPosition === "left" && <span className="mr-2">{item.icon}</span>}

                <span className="flex-grow">{item.title}</span>

                {item.icon && item.iconPosition === "right" && <span className="ml-2">{item.icon}</span>}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
