import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";

interface ReadMoreProps {
  text: string;
}

const ReadMore = ({ text }: ReadMoreProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkHeight = () => {
      if (textRef.current) {
        const lineHeight = parseInt(window.getComputedStyle(textRef.current).lineHeight);
        const maxHeight = lineHeight * 3; // 3 lines of text
        const shouldExpand = textRef.current.scrollHeight > maxHeight;
        if (shouldExpand !== needsExpansion) {
          setNeedsExpansion(shouldExpand);
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(checkHeight);

    const handleResize = () => {
      requestAnimationFrame(checkHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [text, needsExpansion]);

  if (!text?.trim()) {
    return null;
  }

  return (
    <div className="relative">
      <motion.div
        ref={textRef}
        layout
        initial={{ height: "3.5rem" }}
        animate={{ height: isExpanded ? "auto" : "3.5rem" }}
        transition={{ duration: 0.5 }}
        className={`font-medium text-sm leading-tight transition-all duration-500 ${!isExpanded && needsExpansion ? "fade-gradient" : ""}`}
      >
        {text}
      </motion.div>

      {needsExpansion && !isExpanded && (
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

export default ReadMore;
