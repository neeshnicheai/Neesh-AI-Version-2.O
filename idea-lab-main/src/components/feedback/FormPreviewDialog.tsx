import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Upload } from "lucide-react";
import type { FormField } from "@/hooks/useFeedbackForms";

interface FormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: FormField[];
}

export function FormPreviewDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
}: FormPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <p className="text-muted-foreground">{description}</p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="font-medium text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {renderInteractiveField(field)}
            </div>
          ))}
          
          <Button className="w-full mt-6">Submit Feedback</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function renderInteractiveField(field: FormField) {
  switch (field.type) {
    case "short_text":
    case "email":
    case "phone":
    case "url":
    case "number":
      return (
        <Input 
          type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
          placeholder={field.placeholder || "Enter your answer"} 
        />
      );
    
    case "long_text":
      return (
        <Textarea 
          placeholder={field.placeholder || "Enter your answer"} 
          className="min-h-[100px]"
        />
      );
    
    case "multiple_choice":
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name={field.id} className="w-5 h-5" />
              <span className="text-foreground">{option}</span>
            </label>
          ))}
        </div>
      );
    
    case "checkboxes":
      return (
        <div className="space-y-2">
          {field.options?.map((option, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5" />
              <span className="text-foreground">{option}</span>
            </label>
          ))}
        </div>
      );
    
    case "dropdown":
      return (
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option, idx) => (
              <SelectItem key={idx} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
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
                className="w-10 h-10 border-2 border-border text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {(field.scaleMin || 1) + i}
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{field.scaleMaxLabel}</span>
        </div>
      );
    
    case "date":
      return <Input type="date" />;
    
    case "time":
      return <Input type="time" />;
    
    case "file_upload":
      return (
        <div className="border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
        </div>
      );
    
    case "rating":
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className="w-8 h-8 text-muted-foreground/30 hover:text-warning cursor-pointer transition-colors" 
            />
          ))}
        </div>
      );
    
    case "toggle":
      return <Switch />;
    
    default:
      return null;
  }
}
