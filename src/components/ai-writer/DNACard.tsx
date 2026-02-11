import Link from "next/link";
import { Edit, Trash2, Star, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DNACard({
  id,
  name,
  isDefault,
  onSetDefault,
  onDelete,
}: {
  id: string;
  name: string;
  isDefault: boolean;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <Link href={`/ai-writer/dnas/${id}`} className="block mb-4 group">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate group-hover:opacity-80">
                {name}
              </h3>
              {isDefault && (
                <span className="inline-flex items-center mt-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Default
                </span>
              )}
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onSetDefault}
            disabled={isDefault}
          >
            {isDefault ? "Default" : "Set as default"}
          </Button>
          <Link href={`/ai-writer/dnas/${id}`}>
            <Button variant="ghost" size="icon">
              <Edit className="w-4 h-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
