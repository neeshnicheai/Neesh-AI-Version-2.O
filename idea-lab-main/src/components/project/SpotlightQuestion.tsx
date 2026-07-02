import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SpotlightQuestionProps {
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  isSubmitting?: boolean;
  isLastStep?: boolean;
  /** Optional: render a different input instead of the default textarea */
  customInput?: React.ReactNode;
}

const SpotlightQuestion = ({
  title,
  description,
  placeholder,
  value,
  onChange,
  onNext,
  onBack,
  currentStep,
  totalSteps,
  isSubmitting = false,
  isLastStep = false,
  customInput,
}: SpotlightQuestionProps) => {
  const progressPercent = ((currentStep) / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
            background: "linear-gradient(90deg, hsl(190, 85%, 38%), hsl(186, 93%, 48%))",
          }}
        />
      </div>

      {/* Step indicator */}
      <div className="px-8 pt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-sm font-medium text-gray-400">
          {currentStep} / {totalSteps}
        </span>
      </div>

      {/* Main content — centered */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Title */}
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-tight"
            style={{ color: "hsl(190, 85%, 38%)" }}
          >
            {title}
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-gray-700 text-center italic leading-relaxed font-medium max-w-xl mx-auto">
            {description}
          </p>

          {/* Input area */}
          {customInput ? (
            customInput
          ) : (
            <div className="relative">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={5}
                className="w-full px-6 py-5 text-base text-gray-800 bg-white rounded-2xl resize-none
                  focus:outline-none focus:ring-0 transition-all duration-200
                  placeholder:text-gray-400"
                style={{
                  border: "2px solid hsl(190, 85%, 55%)",
                  boxShadow: "0 2px 12px rgba(9, 218, 237, 0.08)",
                }}
                onFocus={(e) => {
                  e.target.style.border = "2px solid hsl(190, 85%, 38%)";
                  e.target.style.boxShadow = "0 4px 20px rgba(9, 218, 237, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "2px solid hsl(190, 85%, 55%)";
                  e.target.style.boxShadow = "0 2px 12px rgba(9, 218, 237, 0.08)";
                }}
              />
            </div>
          )}

          {/* Next / Finish button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={onNext}
              disabled={isSubmitting || (!customInput && !value.trim())}
              className="px-10 py-3 text-base font-semibold rounded-xl gap-2 min-w-[180px]"
              style={{
                background: "linear-gradient(135deg, hsl(190, 85%, 38%), hsl(186, 93%, 48%))",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : isLastStep ? (
                <>
                  Finish
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightQuestion;
