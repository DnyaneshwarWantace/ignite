import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
export default function EmptyState({ title, description, buttonText, onClick, writer = false }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center  p-8 text-center"
    >
      <div className="mb-4 rounded-full bg-gray-100 p-6">
        {/* <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Plus className="h-12 w-12 text-gray-400" />
        </motion.div> */}
        <img src={withBasePath(writer ? "/images/writer-empty.svg" : "/images/c-empty.svg")} alt="blank" />
      </div>
      <h3 className="mb text-lg text-muted-foreground font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-gray-500">{description}</p>
      {buttonText && (
        <Button onClick={onClick} className="bg-purple-500 hover:bg-purple-600">
          {buttonText}
        </Button>
      )}
    </motion.div>
  );
}
