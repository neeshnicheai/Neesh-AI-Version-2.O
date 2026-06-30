import {
  Type,
  AlignLeft,
  Circle,
  CheckSquare,
  ChevronDown,
  List,
  Calendar,
  Clock,
  Upload,
  Star,
  Hash,
  Mail,
  Phone,
  Link as LinkIcon,
  ToggleLeft,
  Briefcase,
} from "lucide-react";
import type { FieldType } from "@/hooks/useFeedbackForms";

export const fieldTypes: { type: FieldType; label: string; icon: any }[] = [
  { type: "short_text", label: "Short Text", icon: Type },
  { type: "long_text", label: "Long Text", icon: AlignLeft },
  { type: "multiple_choice", label: "Multiple Choice", icon: Circle },
  { type: "checkboxes", label: "Checkboxes", icon: CheckSquare },
  { type: "dropdown", label: "Dropdown", icon: ChevronDown },
  { type: "linear_scale", label: "Linear Scale", icon: List },
  { type: "date", label: "Date", icon: Calendar },
  { type: "time", label: "Time", icon: Clock },
  { type: "file_upload", label: "File Upload", icon: Upload },
  { type: "rating", label: "Star Rating", icon: Star },
  { type: "number", label: "Number", icon: Hash },
  { type: "email", label: "Email", icon: Mail },
  { type: "phone", label: "Phone", icon: Phone },
  { type: "url", label: "URL", icon: LinkIcon },
  { type: "toggle", label: "Toggle", icon: ToggleLeft },
  { type: "occupation", label: "Occupation", icon: Briefcase },
];

interface FieldTypesListProps {
  onAddField: (type: FieldType) => void;
}

export function FieldTypesList({ onAddField }: FieldTypesListProps) {
  return (
    <div className="space-y-2">
      {fieldTypes.map((fieldType) => (
        <button
          key={fieldType.type}
          onClick={() => onAddField(fieldType.type)}
          className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 border border-transparent hover:border-border"
        >
          <fieldType.icon className="w-5 h-5" />
          <span className="text-sm font-medium">{fieldType.label}</span>
        </button>
      ))}
    </div>
  );
}
