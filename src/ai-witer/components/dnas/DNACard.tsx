import Link from "next/link";
import { Edit, Trash2, Star, Database } from "lucide-react";
import { Card } from "@/components/ui/card";

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
    <Card className="p-6 transition-shadow hover:shadow-md">
      <Link href={`/dnas/${id}`} className="block mb-4 group">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
              {name}
            </h3>
            {isDefault && (
              <span className="inline-flex items-center mt-1 text-xs text-gray-600">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Default
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center space-x-2">
        <button
          onClick={onSetDefault}
          disabled={isDefault}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
        >
          {isDefault ? "Default" : "Set as default"}
        </button>
        <Link
          href={`/dnas/${id}`}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
        >
          <Edit className="w-4 h-4" />
        </Link>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}

