import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Upload,
  Star,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Pencil,
} from "lucide-react";
import { fieldTypes } from "./FieldTypesList";
import type { FormField } from "@/hooks/useFeedbackForms";

interface FieldPreviewProps {
  field: FormField;
  index: number;
  totalFields: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function FieldPreview({
  field,
  index,
  totalFields,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
}: FieldPreviewProps) {
  const FieldIcon = fieldTypes.find(f => f.type === field.type)?.icon;

  return (
    <div
      onClick={onSelect}
      className={`bg-card border-2 p-5 cursor-pointer transition-all duration-200 ${isSelected
          ? "border-primary shadow-md ring-2 ring-primary/20"
          : "border-border/30 hover:border-primary/50"
        }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 cursor-move text-muted-foreground hover:text-foreground">
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                {FieldIcon && <FieldIcon className="w-4 h-4 text-primary" />}
              </div>
              <span className="font-medium text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </span>
            </div>

            {/* Action buttons - always visible */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                disabled={index === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                disabled={index === totalFields - 1}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Field Preview Based on Type */}
          {renderFieldInput(field)}
        </div>
      </div>
    </div>
  );
}

function renderFieldInput(field: FormField) {
  switch (field.type) {
    case "short_text":
    case "email":
    case "phone":
    case "url":
    case "number":
    case "occupation":
      return (
        <Input
          placeholder={field.placeholder || "Enter your answer"}
          disabled
          className="bg-muted/30"
        />
      );

    case "long_text":
      return (
        <Textarea
          placeholder={field.placeholder || "Enter your answer"}
          disabled
          className="bg-muted/30 min-h-[80px]"
        />
      );

    case "multiple_choice":
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-border" />
              <span className="text-muted-foreground">{option}</span>
            </div>
          ))}
        </div>
      );

    case "checkboxes":
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-border" />
              <span className="text-muted-foreground">{option}</span>
            </div>
          ))}
        </div>
      );

    case "dropdown":
      return (
        <Select disabled>
          <SelectTrigger className="bg-muted/30">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
        </Select>
      );

    case "linear_scale":
      return (
        <div className="flex items-center gap-2 justify-between">
          <span className="text-sm text-muted-foreground">{field.scaleMinLabel}</span>
          <div className="flex gap-2">
            {Array.from({ length: (field.scaleMax || 5) - (field.scaleMin || 1) + 1 }, (_, i) => (
              <button
                key={i}
                className="w-10 h-10 border-2 border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                disabled
              >
                {(field.scaleMin || 1) + i}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{field.scaleMaxLabel}</span>
        </div>
      );

    case "date":
      return <Input type="date" disabled className="bg-muted/30" />;

    case "time":
      return <Input type="time" disabled className="bg-muted/30" />;

    case "file_upload":
      return (
        <div className="border-2 border-dashed border-border p-6 text-center bg-muted/30">
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
        </div>
      );

    case "rating":
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="w-8 h-8 text-muted-foreground/30 hover:text-warning transition-colors" />
          ))}
        </div>
      );

    case "toggle":
      return <Switch disabled />;

    default:
      return null;
  }
}
