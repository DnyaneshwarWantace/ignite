import { useState, useRef, useEffect } from "react";
import ReadMore from "./ReadMore";

interface AdDescriptionProps {
  text?: string;
  expand?: boolean;
}

const AdDescription = ({ text, expand = false }: AdDescriptionProps) => {
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      // Check if content height is greater than container height (3.5rem = 56px)
      setNeedsExpansion(textRef.current.scrollHeight > 56);
    }
  }, [text]);

  // If no text, don't render anything
  if (!text?.trim()) {
    return null;
  }

  // If not expanded or text is short enough, show as simple text
  if (!expand || !needsExpansion) {
    return (
      <h3 ref={textRef} className="font-medium text-sm leading-tight">
        {text}
      </h3>
    );
  }

  // If expanded and text is long, show with ReadMore
  return <ReadMore text={text} />;
};

export default AdDescription; 