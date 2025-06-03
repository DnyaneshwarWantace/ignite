import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";

const ReadMore = ({ text }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div className="relative">
      {/* Text container with layout animation for height transition */}
      <motion.div
        layout
        initial={{ height: "3.5rem" }}
        animate={{ height: isExpanded ? "auto" : "3.5rem" }}
        transition={{ duration: 0.5 }}
        className={`font-medium text-sm leading-tight transition-all duration-500 ${!isExpanded ? "fade-gradient" : ""}`}
      >
        {text}
      </motion.div>

      {/* Button with fade in/out animation */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-x-0 bottom-0 flex w-full items-center h-10 bg-gradient-to-t from-white via-white"
        >
          <Badge variant={"outline"} className="mx-auto bg-white cursor-pointer" onClick={toggleExpand}>
            Read More
          </Badge>
        </motion.div>
      )}
    </div>
  );
};

export default ReadMore;
