import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Copy, Trash2, Plus } from "lucide-react";
import { fieldTypes } from "./FieldTypesList";
import type { FormField, FieldType } from "@/hooks/useFeedbackForms";

interface FieldSettingsProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddOption: () => void;
  onUpdateOption: (index: number, value: string) => void;
  onDeleteOption: (index: number) => void;
}

export function FieldSettings({
  field,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}: FieldSettingsProps) {
  const hasPlaceholder = ["short_text", "long_text", "email", "phone", "url", "number"].includes(field.type);
  const hasOptions = ["multiple_choice", "checkboxes", "dropdown"].includes(field.type);

  return (
    <aside className="w-80 bg-card border-l border-border/50 flex flex-col shadow-sm">
      <div className="p-5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Field Settings</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onDuplicate}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Field Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Field Type</Label>
          <Select 
            value={field.type} 
            onValueChange={(value: FieldType) => onUpdate({ type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type) => (
                <SelectItem key={type.type} value={type.type}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Label */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Label</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
          />
        </div>
        
        {/* Placeholder */}
        {hasPlaceholder && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Placeholder</Label>
            <Input
              value={field.placeholder || ""}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
            />
          </div>
        )}
        
        {/* Options for Multiple Choice, Checkboxes, Dropdown */}
        {hasOptions && field.options && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Options</Label>
            {field.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => onUpdateOption(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-destructive"
                  onClick={() => onDeleteOption(index)}
                  disabled={field.options!.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onAddOption}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>
        )}
        
        {/* Linear Scale Settings */}
        {field.type === "linear_scale" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Min Value</Label>
                <Input
                  type="number"
                  value={field.scaleMin || 1}
                  onChange={(e) => onUpdate({ scaleMin: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Value</Label>
                <Input
                  type="number"
                  value={field.scaleMax || 5}
                  onChange={(e) => onUpdate({ scaleMax: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Min Label</Label>
              <Input
                value={field.scaleMinLabel || ""}
                onChange={(e) => onUpdate({ scaleMinLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Label</Label>
              <Input
                value={field.scaleMaxLabel || ""}
                onChange={(e) => onUpdate({ scaleMaxLabel: e.target.value })}
              />
            </div>
          </>
        )}
        
        {/* Required Toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-muted/30">
          <Label className="text-sm font-medium">Required</Label>
          <Switch
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked })}
          />
        </div>
      </div>
    </aside>
  );
}
