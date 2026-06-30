import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  Plus,
  Eye,
  Save,
  Sparkles,
  Loader2,
} from "lucide-react";
import { NeeshLogo } from "@/components/NeeshLogo";
import { FieldTypesList } from "@/components/feedback/FieldTypesList";
import { FieldPreview } from "@/components/feedback/FieldPreview";
import { FieldSettings } from "@/components/feedback/FieldSettings";
import { FormPreviewDialog } from "@/components/feedback/FormPreviewDialog";
import { useFeedbackForms } from "@/hooks/useFeedbackForms";

const FeedbackBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const {
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    fields,
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
  } = useFeedbackForms(id);

  const handleSave = async () => {
    const success = await saveForm();
    if (success) {
      // Navigate to project page after saving
      navigate(`/project/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Field Types */}
      <aside className="w-72 bg-card border-r border-border/50 flex flex-col shadow-sm">
        <div className="p-5 border-b border-border/50">
          <Link to={`/project/${id}`}>
            <NeeshLogo size="sm" />
          </Link>
        </div>
        
        <div className="p-5 border-b border-border/50">
          <h2 className="font-display font-semibold text-lg mb-1">Form Elements</h2>
          <p className="text-sm text-muted-foreground">Click to add a field</p>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <FieldTypesList onAddField={addField} />
        </div>
        
        <div className="p-4 border-t border-border/50">
          <Link to={`/project/${id}`}>
            <Button variant="outline" className="w-full gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Project
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content - Form Builder */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border/50 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-display font-semibold text-lg">Feedback Form Builder</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
            <Button 
              size="sm" 
              className="gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Form"}
            </Button>
          </div>
        </header>

        {/* Form Builder Area */}
        <main className="flex-1 overflow-auto p-8 bg-background">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Form Header */}
            <div className="bg-card border border-border/30 p-6 shadow-sm">
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="font-display font-semibold text-2xl border-0 p-0 h-auto focus-visible:ring-0 bg-transparent mb-3 text-foreground"
                placeholder="Form Title"
              />
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="border-0 p-0 focus-visible:ring-0 bg-transparent resize-none text-muted-foreground"
                placeholder="Form description..."
              />
            </div>

            {/* Form Fields */}
            {fields.map((field, index) => (
              <FieldPreview
                key={field.id}
                field={field}
                index={index}
                totalFields={fields.length}
                isSelected={selectedFieldId === field.id}
                onSelect={() => setSelectedFieldId(field.id)}
                onMoveUp={() => moveField(field.id, "up")}
                onMoveDown={() => moveField(field.id, "down")}
                onDelete={() => deleteField(field.id)}
                onDuplicate={() => duplicateField(field.id)}
              />
            ))}

            {/* Add Field Button */}
            <button
              onClick={() => addField("short_text")}
              className="w-full border-2 border-dashed border-border p-6 text-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <Plus className="w-5 h-5 inline-block mr-2" />
              Add New Field
            </button>
          </div>
        </main>
      </div>

      {/* Right Panel - Field Settings */}
      {selectedField && (
        <FieldSettings
          field={selectedField}
          onUpdate={(updates) => updateField(selectedField.id, updates)}
          onDuplicate={() => duplicateField(selectedField.id)}
          onDelete={() => deleteField(selectedField.id)}
          onAddOption={() => addOption(selectedField.id)}
          onUpdateOption={(index, value) => updateOption(selectedField.id, index, value)}
          onDeleteOption={(index) => deleteOption(selectedField.id, index)}
        />
      )}

      {/* Preview Dialog */}
      <FormPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={formTitle}
        description={formDescription}
        fields={fields}
      />
    </div>
  );
};

export default FeedbackBuilder;
