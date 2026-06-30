import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { useInView } from "../hooks/useScrollProgress";
import defaultChatbotAvatar from "../assets/chatbot-avatar.png";

/* ─── Simulated UI Snippets ─── */

function EditorSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="text-[10px] text-gray-400 font-mono ml-2">Blog Editor — blog-draft.neesh.ai</div>
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 bg-white">
        {["B", "I", "U", "S", "H1", "H2", "Link", "📷", "📹"].map((tool) => (
          <div key={tool} className="w-7 h-7 flex items-center justify-center text-[10px] text-gray-500 font-bold bg-gray-50 border border-gray-100 hover:bg-[#09daed]/5 hover:border-[#09daed]/20 cursor-pointer transition-colors">{tool}</div>
        ))}
        <div className="ml-auto flex gap-1">
          <div className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-[9px] text-gray-500 font-bold">Draft</div>
          <div className="px-2.5 py-1 bg-[#09daed]/10 border border-[#09daed]/30 text-[9px] text-[#09daed] font-bold">Save</div>
        </div>
      </div>
      {/* Content area */}
      <div className="p-5 space-y-4">
        <div className="border-l-3 border-[#09daed] pl-4">
          <div className="text-[10px] text-[#09daed] font-bold tracking-widest uppercase mb-1">Introduction</div>
          <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
          <div className="h-3 bg-gray-100 rounded w-4/5" />
        </div>
        <div className="border-l-3 border-[#7c3aed] pl-4">
          <div className="text-[10px] text-[#7c3aed] font-bold tracking-widest uppercase mb-1">Content</div>
          <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
          <div className="h-3 bg-gray-100 rounded w-5/6 mb-1.5" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
        {/* Section reorder */}
        <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-200 bg-gray-50/50">
          <svg viewBox="0 0 24 24" fill="#09daed" width="14" height="14"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
          <span className="text-[10px] text-gray-500 font-medium">Drag to reorder sections</span>
        </div>
      </div>
    </div>
  );
}

function FeedbackBuilderSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-[#f59e0b]/5">
        <svg viewBox="0 0 24 24" fill="#f59e0b" width="14" height="14"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" /></svg>
        <span className="text-[10px] text-[#f59e0b] font-bold tracking-widest">FEEDBACK BUILDER</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="border border-gray-100 bg-gray-50/50 p-3">
          <div className="text-[10px] text-gray-500 font-bold mb-1.5">Star Rating</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} viewBox="0 0 24 24" width="14" height="14" fill={s <= 4 ? "#f59e0b" : "#e5e7eb"}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            ))}
          </div>
        </div>
        <div className="border border-gray-100 bg-gray-50/50 p-3">
          <div className="text-[10px] text-gray-500 font-bold mb-1.5">Open-Ended Question</div>
          <div className="h-8 border border-gray-200 rounded bg-white flex items-center px-2">
            <span className="text-[10px] text-gray-300">What feature would you add?</span>
          </div>
        </div>
        <div className="border border-gray-100 bg-gray-50/50 p-3">
          <div className="text-[10px] text-gray-500 font-bold mb-1.5">Scale Rating (1-10)</div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-[70%] bg-gradient-to-r from-[#09daed] to-[#7c3aed] rounded-full" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-400">Not likely</span>
            <span className="text-[9px] text-gray-400">Very likely</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeBaseSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-[#10b981]/5">
        <svg viewBox="0 0 24 24" fill="#10b981" width="14" height="14"><path d="M12 2l-5.5 9h11L12 2zm0 12.5c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z" /></svg>
        <span className="text-[10px] text-[#10b981] font-bold tracking-widest">KNOWLEDGE BASE</span>
      </div>
      <div className="p-4 space-y-2">
        <div className="border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" width="24" height="24" className="mx-auto mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          <span className="text-[10px] text-gray-500 font-medium">Drop files to upload</span>
        </div>
        {["product-brief.pdf", "user-research.docx", "faq-dataset.csv"].map((doc) => (
          <div key={doc} className="flex items-center gap-2 px-3 py-2 border border-gray-100 bg-white">
            <div className="w-6 h-6 bg-[#10b981]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="#10b981" width="10" height="10"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" /></svg>
            </div>
            <span className="text-[10px] text-gray-700 font-medium flex-1">{doc}</span>
            <div className="text-[9px] text-green-600 font-bold">✓ Indexed</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatbotFeatureSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-[#09daed]/5">
        <img src={defaultChatbotAvatar} alt="AI" className="w-12 h-12 object-contain drop-shadow-sm" />
        <span className="text-[10px] text-[#09daed] font-bold tracking-widest uppercase">AI CHATBOT TESTER</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#09daed] animate-pulse" />
          <span className="text-[8px] text-gray-400 font-bold uppercase">Online</span>
        </div>
      </div>
      <div className="p-4 space-y-3 min-h-[200px] flex flex-col">
        <div className="self-start bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2 max-w-[85%]">
          <p className="text-[11px] text-gray-700 leading-relaxed">👋 Hi! I'm your idea's AI representative. I've indexed your Knowledge Base (3 docs). Ask me anything!</p>
        </div>
        <div className="self-end bg-[#09daed]/10 border border-[#09daed]/20 rounded-2xl rounded-tr-none px-4 py-2 max-w-[85%]">
          <p className="text-[11px] text-gray-700 leading-relaxed">How does the revenue model work?</p>
        </div>
        <div className="self-start bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2 max-w-[85%]">
          <p className="text-[11px] text-gray-700 leading-relaxed">Based on your "business-plan.pdf", you're using a freemium SaaS model with a $9/mo Pro tier...</p>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
          <div className="flex-1 h-8 bg-gray-50 border border-gray-100 rounded px-3 flex items-center">
            <span className="text-[9px] text-gray-400">Type a question to test...</span>
          </div>
          <div className="w-8 h-8 bg-[#09daed] rounded flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="black" width="14" height="14"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublishedBlogSnippet() {
  return (
    <div className="bg-white border border-[#09daed]/20 overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(9,218,237,0.1)" }}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="text-[10px] text-gray-400 bg-gray-100 px-4 py-0.5 font-mono">neesh.ai/p/my-startup-idea</div>
        </div>
        <div className="w-2 h-2 bg-[#09daed] animate-pulse" />
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <img src="/neesh-logo.png" alt="Neesh AI" className="w-5 h-5 object-contain" />
          <span className="text-[9px] text-[#09daed] font-bold tracking-widest uppercase border border-[#09daed]/20 px-2 py-0.5 bg-[#09daed]/5">LIVE</span>
        </div>
        <h3 className="text-base font-extrabold text-gray-950">My Startup Idea Validation</h3>
        <div className="border-l-3 border-[#09daed] pl-3 text-xs text-gray-600 font-medium leading-relaxed">
          We propose a platform that helps founders validate their ideas before spending months building...
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Views", val: "2.5k", color: "#09daed" },
            { label: "Feedback", val: "482", color: "#7c3aed" },
            { label: "Chatbot Q's", val: "127", color: "#f59e0b" },
          ].map((m) => (
            <div key={m.label} className="p-2 border border-gray-100 bg-gray-50 text-center">
              <div className="text-sm font-bold" style={{ color: m.color }}>{m.val}</div>
              <div className="text-[9px] text-gray-500 font-medium">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Mini chatbot indicator */}
      <div className="absolute bottom-3 right-3">
        <div className="w-9 h-9 bg-[#09daed] flex items-center justify-center rounded-full" style={{ boxShadow: "0 4px 16px rgba(9,218,237,0.4)" }}>
          <svg viewBox="0 0 24 24" fill="black" width="16" height="16"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a3 3 0 0 1 3 3v2h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2v2a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-2H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2V10a3 3 0 0 1 3-3h1V5.73A2 2 0 1 1 12 2z" /></svg>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function BlogInfoPage() {
  return (
    <PageLayout>
      {/* Section 1: Hero */}
      <section className="relative bg-white/50 pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `linear-gradient(#09daed 1px, transparent 1px), linear-gradient(90deg, #09daed 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#7c3aed]/5 blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4">
            Blog Creation Pipeline
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-950 leading-[1.1] tracking-tight mb-6">
            Create. Publish. <span className="text-[#09daed]">Validate.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            Create rich, interactive blogs from your ideas — embed media, customize feedback sections, attach a knowledge base, and publish with a single shareable link.
          </motion.p>
        </div>
      </section>

      {/* Section 2: Create & Edit */}
      <section className="relative bg-white/50 py-12">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold tracking-widest text-[#09daed]">01</span>
                <span className="text-[9px] font-bold tracking-widest text-[#09daed] border border-[#09daed]/20 px-2 py-0.5 bg-[#09daed]/5">CREATE & EDIT</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-950 mb-4">Write your validation blog with a powerful editor</h2>
              <p className="text-gray-600 text-base leading-relaxed font-medium mb-6">
                Structure your idea into sections — Introduction, Problem Statement, Solution, and more. Use the rich text toolbar for formatting, add images and videos, then drag to reorder sections until the flow feels right.
              </p>
              <ul className="space-y-3">
                {["Rich text formatting (bold, italic, headings)", "Image & video embedding", "Section drag-and-drop reordering", "Auto-save drafts"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <div className="w-1.5 h-1.5 bg-[#09daed]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <EditorSnippet />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
      </section>

      {/* Section 3: Feedback & Knowledge Base */}
      <section className="relative bg-white/50 py-12">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="flex items-center gap-3 justify-center mb-4">
              <span className="text-[10px] font-bold tracking-widest text-[#f59e0b]">02</span>
              <span className="text-[9px] font-bold tracking-widest text-[#f59e0b] border border-[#f59e0b]/20 px-2 py-0.5 bg-[#f59e0b]/5">FEEDBACK & KNOWLEDGE</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-950 mb-4">Collect targeted feedback & build your knowledge base</h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-medium">
              Add custom feedback forms at any point in your blog to capture reactions. Upload documents to build an AI-powered knowledge base that trains your chatbot.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-gray-950 mb-4 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="#f59e0b" width="18" height="18"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" /></svg>
                Custom Feedback Forms
              </h3>
              <p className="text-gray-600 text-sm mb-4 font-medium">Build star ratings, open-ended questions, scale ratings, and more — all embedded directly into your blog.</p>
              <FeedbackBuilderSnippet />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-950 mb-4 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="#10b981" width="18" height="18"><path d="M12 2l-5.5 9h11L12 2zm0 12.5c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z" /></svg>
                Knowledge Base
              </h3>
              <p className="text-gray-600 text-sm mb-4 font-medium">Upload PDFs, docs, and research files. They're auto-indexed and used to train your chatbot for intelligent responses.</p>
              <KnowledgeBaseSnippet />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
      </section>

      {/* Section 4: Publish & Share */}
      <section className="relative bg-white/50 py-12">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold tracking-widest text-[#09daed]">03</span>
                <span className="text-[9px] font-bold tracking-widest text-[#09daed] border border-[#09daed]/20 px-2 py-0.5 bg-[#09daed]/5">PUBLISH & SHARE</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-950 mb-4">Go live in one click</h2>
              <p className="text-gray-600 text-base leading-relaxed font-medium mb-6">
                Publish your validation blog with a branded link. The embedded AI chatbot answers visitor questions, while you track views, feedback signals, and engagement metrics in real time.
              </p>
              <ul className="space-y-3">
                {["One-click publishing", "Branded shareable link", "Embedded AI chatbot", "Live engagement metrics", "Cross-promotion discovery"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <div className="w-1.5 h-1.5 bg-[#09daed]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <PublishedBlogSnippet />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
      </section>

      {/* Section 5: Chatbot & API Keys */}
      <section className="relative bg-white/50 py-12">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold tracking-widest text-[#09daed]">04</span>
                <span className="text-[9px] font-bold tracking-widest text-[#09daed] border border-[#09daed]/20 px-2 py-0.5 bg-[#09daed]/5">AI CHATBOT</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-950 mb-4">Test your chatbot in real-time</h2>
              <p className="text-gray-600 text-base leading-relaxed font-medium mb-6">
                Your chatbot isn't just a script — it's a trained representative of your idea. It uses your Knowledge Base to answer complex questions from visitors, capturing their intent and confusion points automatically.
              </p>
              
              <div className="bg-gray-50/50 border border-gray-200 p-6 rounded-xl space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-950 mb-2 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="#09daed" width="16" height="16"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" /></svg>
                    Use Your Own API Key for Better Performance
                  </h4>
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                    Bring your own API key to unlock faster responses and higher-quality answers.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-[10px] font-bold text-[#09daed] uppercase tracking-wider mb-2">How it works:</h5>
                      <ul className="space-y-1.5">
                        {["Add your preferred AI provider (like Gemini or OpenAI) in Chatbot Settings", "Paste your API key", "Save — and you're done"].map((step, i) => (
                          <li key={i} className="text-[11px] text-gray-700 font-medium flex gap-2">
                            <span className="text-[#09daed]">{i+1}.</span> {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-bold text-[#09daed] uppercase tracking-wider mb-2">What you get:</h5>
                      <ul className="space-y-1.5">
                        {[
                          { icon: "⚡", text: "Faster response times" },
                          { icon: "🧠", text: "Better answer quality (use advanced models)" },
                          { icon: "💰", text: "Full control over your usage & billing" }
                        ].map((item, i) => (
                          <li key={i} className="text-[11px] text-gray-700 font-medium flex gap-2">
                            <span>{item.icon[0]}</span> {item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-[10px] text-gray-500 font-medium italic">
                      <span className="font-bold text-gray-700 not-italic">Important:</span> Your API key is used for generating answers. The system still handles data processing in the background for accuracy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:order-1">
              <ChatbotFeatureSnippet />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
      </section>

      {/* CTA */}
      <section className="relative bg-white/50 py-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4">Start creating your validation blog</h2>
          <p className="text-gray-600 mb-8 font-medium">From raw idea to published blog in minutes — no coding required.</p>
          <Link to="/signup" className="bg-[#09daed] text-black font-bold px-8 py-4 text-sm hover:bg-[#07c4d4] transition-all duration-200 animate-pulse-glow inline-block">
            Get Started Free
          </Link>
        </motion.div>
      </section>
    </PageLayout>
  );
}
