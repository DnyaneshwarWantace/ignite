import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import Button from "../ui/Button";

export default function EmptyState() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No DNAs yet</h3>
      <p className="text-gray-600 mb-6">
        Create your first Campaign DNA to get started
      </p>
      <Link href="/dnas/new">
        <Button>
          <Plus className="w-5 h-5 mr-2 inline" />
          Create Your First DNA
        </Button>
      </Link>
    </div>
  );
}

