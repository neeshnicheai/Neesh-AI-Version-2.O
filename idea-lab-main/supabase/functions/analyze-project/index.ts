import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectData, feedbackData, questionsData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

const systemPrompt = `You are an expert startup advisor and idea validation specialist. Analyze the project information, user feedback, and questions to provide deep validation insights.

Your response must be a JSON object with this exact structure:
{
  "validationStage": "early" | "gathering" | "detecting" | "refining" | "validated",
  "summary": "A 2-3 sentence executive summary of the idea's validation status",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "nextSteps": ["action 1", "action 2", "action 3"],
  "healthScores": {
    "clarityIndex": 0-100,
    "marketSignal": 0-100,
    "gapVelocity": 0-100,
    "validationMomentum": 0-100
  },
  "gapAnalysis": {
    "activeGaps": [
      { "id": "gap1", "topic": "Topic name", "questionCount": 5, "personas": ["developer", "investor"], "severity": "high" | "medium" | "low" }
    ],
    "confusionPatterns": [
      { "id": "pattern1", "topic": "Topic name", "questionCount": 3, "personas": ["marketer"], "suggestedContent": "Specific content suggestion" }
    ]
  },
  "personaEngagement": [
    { "persona": "developer", "visited": 10, "asked": 5, "feedback": 2, "returned": 1 }
  ]
}

Validation Stage Rules:
- "early": Less than 5 total interactions
- "gathering": 5-15 interactions, still collecting feedback
- "detecting": 15+ interactions, gaps being identified
- "refining": Gaps being actively closed, improvement visible
- "validated": High scores across all metrics, minimal gaps

Be specific, data-driven, and constructive. Focus on what needs fixing.`;

    const userPrompt = `Analyze this project:

PROJECT INFO:
Title: ${projectData.title}
Summary: ${projectData.summary || "No summary provided"}
Description: ${projectData.description || "No description provided"}
Status: ${projectData.status}

USER FEEDBACK (${feedbackData?.length || 0} responses):
${feedbackData?.map((f: any) => `- ${f.name} (${f.occupation}): "${f.feedback}"`).join("\n") || "No feedback yet"}

QUESTIONS ASKED (${questionsData?.length || 0} questions):
${questionsData?.map((q: any) => `- "${q.question}" (asked ${q.count} times)`).join("\n") || "No questions yet"}

Provide your analysis as a JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let insights;
    try {
      insights = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-project error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
