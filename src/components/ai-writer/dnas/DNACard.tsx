import Link from "next/link";
import { Edit, Trash2, Star, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DNACardProps {
  id: string;
  name: string;
  isDefault: boolean;
  onSetDefault: () => void;
  onDelete: () => void;
}

export default function DNACard({
  id,
  name,
  isDefault,
  onSetDefault,
  onDelete,
}: DNACardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md aspect-square flex flex-col max-w-[165px] w-full">
      <CardContent className="p-3 flex flex-col flex-1 min-h-0">
        <Link href={`/ai-writer/dnas/${id}`} className="flex flex-col flex-1 min-h-0 group">
          <div className="flex flex-col items-center flex-1 min-h-0 text-center justify-center">
            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mx-auto mb-2">
              <Database className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors text-foreground">
              {name}
            </span>
            {isDefault && (
              <span className="inline-flex items-center mt-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 mr-0.5 fill-primary text-primary shrink-0" />
                Default
              </span>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 min-w-0 h-7 text-xs px-1"
            onClick={onSetDefault}
            disabled={isDefault}
          >
            {isDefault ? "✓" : "Set"}
          </Button>
          <Link href={`/ai-writer/dnas/${id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Edit className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
