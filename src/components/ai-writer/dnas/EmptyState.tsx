import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

interface EmptyStateProps {
  onCreateClick: () => void;
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <Typography variant="h3" className="text-xl font-semibold text-foreground mb-2">No DNAs yet</Typography>
        <Typography variant="p" className="text-muted-foreground mb-6">
          Create your first Campaign DNA to get started
        </Typography>
        <Button onClick={onCreateClick}>
          <Plus className="w-5 h-5 mr-2" />
          Create Your First DNA
        </Button>
      </CardContent>
    </Card>
  );
}
