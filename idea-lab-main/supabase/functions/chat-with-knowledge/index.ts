import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, message, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("title, description, one_line_summary, introduction")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Error fetching project:", projectError);
    }

    // Fetch blog content
    const { data: blog, error: blogError } = await supabase
      .from("blogs")
      .select("heading, introduction, content, custom_fields")
      .eq("project_id", projectId)
      .single();

    if (blogError) {
      console.error("Error fetching blog:", blogError);
    }

    // Fetch uploaded documents metadata (we can't read file contents directly, but we have metadata)
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("original_filename, mime_type, content")
      .eq("project_id", projectId)
      .eq("is_active", true);

    if (docsError) {
      console.error("Error fetching documents:", docsError);
    }

    // Build knowledge context
    let knowledgeContext = "";

    if (project) {
      knowledgeContext += `PROJECT INFORMATION:\n`;
      knowledgeContext += `Title: ${project.title || "Not specified"}\n`;
      knowledgeContext += `Summary: ${project.one_line_summary || "Not specified"}\n`;
      knowledgeContext += `Description: ${project.description || "Not specified"}\n`;
      knowledgeContext += `Introduction: ${project.introduction || "Not specified"}\n\n`;
    }

    if (blog) {
      knowledgeContext += `BLOG CONTENT:\n`;
      knowledgeContext += `Heading: ${blog.heading || "Not specified"}\n`;
      knowledgeContext += `Introduction: ${blog.introduction || "Not specified"}\n`;
      knowledgeContext += `Content: ${blog.content || "Not specified"}\n`;

      if (blog.custom_fields && Array.isArray(blog.custom_fields)) {
        knowledgeContext += `Additional Sections:\n`;
        blog.custom_fields.forEach((field: any) => {
          if (field.value) {
            knowledgeContext += `- ${field.title || field.type}: ${field.value}\n`;
          }
        });
      }
      knowledgeContext += "\n";
    }

    if (documents && documents.length > 0) {
      knowledgeContext += `AVAILABLE DOCUMENTS:\n`;
      documents.forEach((doc: any) => {
        knowledgeContext += `DOCUMENT: ${doc.original_filename} (${doc.mime_type})\n`;
        if (doc.content && doc.content.trim().length > 0) {
          knowledgeContext += `CONTENT:\n${doc.content}\n`;
        } else {
          knowledgeContext += `(No text content extracted)\n`;
        }
        knowledgeContext += `--- END DOCUMENT ---\n\n`;
      });
      knowledgeContext += "\n";
    }

    const systemPrompt = `You are a helpful AI assistant for a project. You have been trained on the following knowledge base:

${knowledgeContext}

Guidelines:
1. Answer questions based on the knowledge base provided above
2. If the question is about something not covered in the knowledge base, start your response with "NO_ANSWER:" followed by a polite explanation
3. Be helpful, friendly, and concise
4. If asked about documents, mention what documents are available
5. Stay focused on topics related to the project`;

    // Build conversation messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({
          response: "I'm currently experiencing high demand. Please try again in a moment."
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({
        response: "I'm having trouble processing your request. Please try again."
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const botResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ response: botResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("chat-with-knowledge error:", error);
    return new Response(JSON.stringify({
      response: "I encountered an error. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
