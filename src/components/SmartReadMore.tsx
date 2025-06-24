import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";

interface SmartReadMoreProps {
  text: string;
}

const SmartReadMore = ({ text }: SmartReadMoreProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const [needsExpansion, setNeedsExpansion] = useState(false);

  useEffect(() => {
    // Check if text needs expansion
    if (textRef.current) {
      const scrollHeight = textRef.current.scrollHeight;
      const clientHeight = textRef.current.clientHeight;
      setNeedsExpansion(scrollHeight > clientHeight);
    }
  }, [text]);

  // If text is empty or doesn't need expansion, just show it
  if (!text?.trim() || !needsExpansion) {
    return (
      <div className="font-medium text-sm leading-tight">
        {text}
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.div
        ref={textRef}
        layout
        initial={{ height: "3.5rem" }}
        animate={{ height: isExpanded ? "auto" : "3.5rem" }}
        transition={{ duration: 0.5 }}
        className={`font-medium text-sm leading-tight transition-all duration-500 ${!isExpanded ? "fade-gradient" : ""}`}
      >
        {text}
      </motion.div>

      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-x-0 bottom-0 flex w-full items-center h-10 bg-gradient-to-t from-white via-white"
        >
          <Badge 
            variant={"outline"} 
            className="mx-auto bg-white cursor-pointer" 
            onClick={() => setIsExpanded(true)}
          >
            Read More
          </Badge>
        </motion.div>
      )}
    </div>
  );
};

export default SmartReadMore; 