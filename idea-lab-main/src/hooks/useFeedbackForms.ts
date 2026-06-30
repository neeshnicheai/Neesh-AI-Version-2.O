import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBlogs } from "./useBlogs";

export type FieldType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "checkboxes"
  | "dropdown"
  | "linear_scale"
  | "date"
  | "time"
  | "file_upload"
  | "rating"
  | "number"
  | "email"
  | "phone"
  | "url"
  | "toggle"
  | "occupation";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
}

export interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

const defaultFields: FormField[] = [
  { id: "1", type: "short_text", label: "Your Name", placeholder: "Enter your name", required: true },
  { id: "2", type: "email", label: "Email Address", placeholder: "Enter your email", required: true },
  { id: "3", type: "occupation", label: "Occupation", placeholder: "e.g. Developer, Designer, Student...", required: false },
  { id: "4", type: "rating", label: "How would you rate your experience?", required: true },
  { id: "5", type: "long_text", label: "Additional Comments", placeholder: "Share your thoughts...", required: false },
];

export function useFeedbackForms(projectId: string | undefined) {
  const [formTitle, setFormTitle] = useState("Feedback Form");
  const [formDescription, setFormDescription] = useState("We'd love to hear your thoughts! Please fill out this form.");
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { getBlog, upsertBlog } = useBlogs();

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const addField = useCallback((type: FieldType) => {
    const newField: FormField = {
      id: String(Date.now()),
      type,
      label: getDefaultLabel(type),
      placeholder: "",
      required: false,
      options: hasOptions(type) ? ["Option 1", "Option 2", "Option 3"] : undefined,
      scaleMin: type === "linear_scale" ? 1 : undefined,
      scaleMax: type === "linear_scale" ? 5 : undefined,
      scaleMinLabel: type === "linear_scale" ? "Poor" : undefined,
      scaleMaxLabel: type === "linear_scale" ? "Excellent" : undefined,
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, []);

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => {
      if (f.id !== fieldId) return f;

      // If the type is changing, initialize type-specific defaults
      if (updates.type && updates.type !== f.type) {
        const newType = updates.type;
        const needsOptions = hasOptions(newType);
        const isScale = newType === "linear_scale";

        return {
          ...f,
          ...updates,
          label: updates.label || getDefaultLabel(newType),
          placeholder: ["short_text", "long_text", "email", "phone", "url", "number", "occupation"].includes(newType) ? (f.placeholder || "") : undefined,
          options: needsOptions ? (hasOptions(f.type) && f.options ? f.options : ["Option 1", "Option 2", "Option 3"]) : undefined,
          scaleMin: isScale ? (f.scaleMin || 1) : undefined,
          scaleMax: isScale ? (f.scaleMax || 5) : undefined,
          scaleMinLabel: isScale ? (f.scaleMinLabel || "Poor") : undefined,
          scaleMaxLabel: isScale ? (f.scaleMaxLabel || "Excellent") : undefined,
        };
      }

      return { ...f, ...updates };
    }));
  }, []);


  const deleteField = useCallback((fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  }, [selectedFieldId]);

  const duplicateField = useCallback((fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const newField = { ...field, id: String(Date.now()) };
      const index = fields.findIndex(f => f.id === fieldId);
      const newFields = [...fields];
      newFields.splice(index + 1, 0, newField);
      setFields(newFields);
      setSelectedFieldId(newField.id);
    }
  }, [fields]);

  const moveField = useCallback((fieldId: string, direction: "up" | "down") => {
    const index = fields.findIndex(f => f.id === fieldId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  }, [fields]);

  const addOption = useCallback((fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field) {
      const currentOptions = field.options || [];
      updateField(fieldId, { options: [...currentOptions, `Option ${currentOptions.length + 1}`] });
    }
  }, [fields, updateField]);


  const updateOption = useCallback((fieldId: string, index: number, value: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.options) {
      const newOptions = [...field.options];
      newOptions[index] = value;
      updateField(fieldId, { options: newOptions });
    }
  }, [fields, updateField]);

  const deleteOption = useCallback((fieldId: string, index: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (field?.options && field.options.length > 1) {
      const newOptions = field.options.filter((_, i) => i !== index);
      updateField(fieldId, { options: newOptions });
    }
  }, [fields, updateField]);

  const saveForm = useCallback(async () => {
    if (!projectId) {
      toast.error("Project ID is required");
      return false;
    }

    setSaving(true);
    try {
      // Get current blog or create new one
      const existingBlog = await getBlog(projectId);

      // Create feedback section data
      const feedbackSection = {
        id: "feedback-form",
        type: "feedback",
        title: formTitle,
        description: formDescription,
        fields: fields,
        order: 999, // Put at end
      };

      // Get existing custom_fields or create empty array
      const existingFields = (existingBlog?.custom_fields as any[]) || [];

      // Remove any existing feedback section and add new one
      const updatedFields = existingFields.filter((f: any) => f.type !== "feedback");
      updatedFields.push(feedbackSection);

      await upsertBlog(projectId, {
        heading: existingBlog?.heading,
        cover_image_url: existingBlog?.cover_image_url || undefined,
        introduction: existingBlog?.introduction || "",
        content: existingBlog?.content || "",
        custom_fields: updatedFields,
      });

      toast.success("Feedback form saved and added to blog!");
      return true;
    } catch (error) {
      console.error("Error saving feedback form:", error);
      toast.error("Failed to save feedback form");
      return false;
    } finally {
      setSaving(false);
    }
  }, [projectId, formTitle, formDescription, fields, getBlog, upsertBlog]);

  return {
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    fields,
    setFields,
    selectedFieldId,
    setSelectedFieldId,
    selectedField,
    addField,
    updateField,
    deleteField,
    duplicateField,
    moveField,
    addOption,
    updateOption,
    deleteOption,
    saveForm,
    saving,
  };
}

function getDefaultLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    short_text: "Short Text",
    long_text: "Long Text",
    multiple_choice: "Multiple Choice",
    checkboxes: "Checkboxes",
    dropdown: "Dropdown",
    linear_scale: "Linear Scale",
    date: "Date",
    time: "Time",
    file_upload: "File Upload",
    rating: "Star Rating",
    number: "Number",
    email: "Email",
    phone: "Phone",
    url: "URL",
    toggle: "Toggle",
    occupation: "Occupation",
  };
  return labels[type];
}

function hasOptions(type: FieldType): boolean {
  return type === "multiple_choice" || type === "checkboxes" || type === "dropdown";
}
