import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState() {
  return (
    <div className="rounded-lg border bg-card p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">No DNAs yet</h3>
      <p className="text-muted-foreground mb-6">
        Create your first Campaign DNA to get started
      </p>
      <Link href="/ai-writer/dnas/new">
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          Create Your First DNA
        </Button>
      </Link>
    </div>
  );
}
