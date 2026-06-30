# Neesh AI - Frontend Architecture Documentation

> **Complete technical documentation of the Neesh AI frontend codebase**
> 
> Last Updated: January 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Design System](#design-system)
4. [Application Structure](#application-structure)
5. [Routing & Navigation](#routing--navigation)
6. [Pages & Components](#pages--components)
7. [Hooks & State Management](#hooks--state-management)
8. [Database Integration](#database-integration)
9. [Styling & Theming](#styling--theming)
10. [Workflow & User Flows](#workflow--user-flows)

---

## 1. Project Overview

**Neesh AI** is a public idea validation and learning loop platform. It enables founders to:

- Upload raw ideas (documents, text, notes)
- Auto-generate a public blog and context-aware chatbot
- Collect structured feedback and questions from visitors
- Detect gaps and confusion points in the idea
- Iteratively improve clarity based on real-world interactions

### Core Concept

> "A closed-loop system where founders upload raw ideas, auto-generate a public blog and context-aware chatbot, collect structured feedback and questions, detect gaps and confusion, fix those gaps, train the chatbot, and repeat until the idea is solid."

---

## 2. Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18.3 |
| **Build Tool** | Vite |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui (Radix primitives) |
| **Routing** | React Router DOM v6 |
| **State Management** | React Query (TanStack Query) |
| **Backend** | Supabase (Lovable Cloud) |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |
| **Animations** | tailwindcss-animate, Framer Motion patterns |
| **Notifications** | Sonner + custom Toast system |

### Package.json Dependencies

```json
{
  "@tanstack/react-query": "^5.83.0",
  "@supabase/supabase-js": "^2.90.1",
  "react": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1",
  "lucide-react": "^0.462.0",
  "sonner": "^1.7.4",
  "recharts": "^2.15.4",
  "zod": "^3.25.76"
}
```

---

## 3. Design System

### 3.1 Visual Identity

The visual identity follows a **"human-designed" CarbonCN enterprise aesthetic**:

| Aspect | Specification |
|--------|---------------|
| **Primary Color** | Cyan `#09daed` (HSL: 190 85% 38%) |
| **Secondary** | Light Cyan `#e1f5f7` (HSL: 186 60% 93%) |
| **Typography** | IBM Plex Sans (fallback: Inter, system-ui) |
| **Border Radius** | `0rem` (perfect rectangles - flat design) |
| **Shadow Style** | Minimal with cyan tint |
| **Design Philosophy** | Flat, non-decorative, enterprise-first |

### 3.2 Color Palette

#### Light Mode (`:root`)

```css
:root {
  /* Primary - Darker cyan for contrast */
  --primary: 190 85% 38%;
  --primary-foreground: 0 0% 100%;
  
  /* Backgrounds */
  --background: 0 0% 100%;
  --foreground: 210 50% 15%;
  --surface: 186 40% 97%;
  
  /* Cards */
  --card: 0 0% 100%;
  --card-foreground: 210 50% 15%;
  
  /* Secondary */
  --secondary: 186 60% 93%;
  --secondary-foreground: 210 50% 15%;
  
  /* Accent */
  --accent: 186 93% 48%;
  --accent-foreground: 0 0% 100%;
  
  /* Status Colors */
  --destructive: 354 81% 48%;
  --success: 140 51% 39%;
  --warning: 45 93% 53%;
  
  /* Muted */
  --muted: 186 30% 96%;
  --muted-foreground: 210 20% 40%;
  
  /* Borders */
  --border: 186 20% 88%;
  --input: 186 20% 88%;
  --ring: 186 93% 48%;
}
```

#### Dark Mode (`.dark`)

```css
.dark {
  --primary: 190 80% 45%;
  --background: 210 50% 8%;
  --foreground: 0 0% 95%;
  --surface: 210 40% 12%;
  --card: 210 40% 12%;
  --muted: 210 30% 16%;
  --border: 210 30% 20%;
}
```

### 3.3 Typography

```css
/* Font Family */
font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes (Tailwind config) */
'xs': ['12px', { lineHeight: '1.33' }]
'sm': ['13px', { lineHeight: '1.38' }]
'base': ['14px', { lineHeight: '1.43' }]
'lg': ['16px', { lineHeight: '1.5' }]
'xl': ['18px', { lineHeight: '1.33' }]
'2xl': ['20px', { lineHeight: '1.3' }]
'3xl': ['22px', { lineHeight: '1.27' }]
'4xl': ['28px', { lineHeight: '1.21' }]
'5xl': ['32px', { lineHeight: '1.19' }]

/* Heading Sizes */
h1 { font-size: 28px; line-height: tight; font-weight: 600; }
h2 { font-size: 22px; line-height: tight; font-weight: 600; }
h3 { font-size: 16px; line-height: snug; font-weight: 600; }
```

### 3.4 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(9 218 237 / 0.05);
--shadow-md: 0 2px 8px -2px rgb(9 218 237 / 0.1);
--shadow-lg: 0 4px 16px -4px rgb(9 218 237 / 0.15);
```

### 3.5 Component Variants (Button)

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 rounded-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85 shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-primary bg-transparent hover:bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-primary/20 border border-border",
        ghost: "hover:bg-secondary text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
  }
)
```

---

## 4. Application Structure

```
src/
├── assets/                    # Static assets (images, logos)
│   ├── chatbot-avatar.png
│   └── neesh-logo.png
├── components/
│   ├── layout/               # Layout components
│   │   ├── Header.tsx        # Landing page header
│   │   └── Footer.tsx        # Landing page footer
│   ├── project/              # Project-specific components
│   │   ├── ProjectOverview.tsx
│   │   ├── IdeaPulseCard.tsx
│   │   ├── ValidationRing.tsx
│   │   ├── GapDetectionPanel.tsx
│   │   ├── IdeaHealthScore.tsx
│   │   ├── PersonaEngagementMatrix.tsx
│   │   ├── ConfusionAnalysis.tsx
│   │   ├── IterationTimeline.tsx
│   │   ├── AISummaryCard.tsx
│   │   ├── AudienceInsights.tsx
│   │   ├── ResponseDetailView.tsx
│   │   └── QuestionDetailView.tsx
│   ├── ui/                   # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ... (50+ components)
│   ├── NavLink.tsx
│   └── NeeshLogo.tsx
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts           # Authentication state
│   ├── useProjects.ts       # Project CRUD operations
│   ├── useBlogs.ts          # Blog content management
│   ├── useDocuments.ts      # Document/file management
│   ├── useCoverImage.ts     # Cover image upload
│   └── use-toast.ts         # Toast notifications
├── integrations/
│   └── supabase/
│       ├── client.ts        # Supabase client (auto-generated)
│       └── types.ts         # Database types (auto-generated)
├── lib/
│   ├── utils.ts             # Utility functions (cn, etc.)
│   └── slugify.ts           # URL slug generation
├── pages/
│   ├── Index.tsx            # Landing page
│   ├── Login.tsx            # Login page
│   ├── Signup.tsx           # Registration page
│   ├── Dashboard.tsx        # Project list/dashboard
│   ├── Project.tsx          # Project editor (main workspace)
│   ├── BlogPreview.tsx      # Blog preview page
│   ├── PublicBlog.tsx       # Public shareable blog
│   ├── Chatbot.tsx          # Chatbot testing page
│   ├── FeedbackBuilder.tsx  # Feedback form builder
│   └── NotFound.tsx         # 404 page
├── App.tsx                  # Main app with routing
├── main.tsx                 # Entry point
└── index.css                # Global styles & CSS variables
```

---

## 5. Routing & Navigation

### 5.1 Route Configuration

```tsx
// src/App.tsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Index />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/p/:slugWithId" element={<PublicBlog />} />
  
  {/* Protected Routes (lazy-loaded) */}
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/project/:id" element={<Project />} />
  <Route path="/project/:id/preview" element={<BlogPreview />} />
  <Route path="/project/:id/feedback" element={<FeedbackBuilder />} />
  <Route path="/project/:id/chatbot" element={<Chatbot />} />
  
  {/* Catch-all */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

### 5.2 Code Splitting

Heavy pages are lazy-loaded for performance:

```tsx
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Project = lazy(() => import("./pages/Project"));
const BlogPreview = lazy(() => import("./pages/BlogPreview"));
const PublicBlog = lazy(() => import("./pages/PublicBlog"));
const FeedbackBuilder = lazy(() => import("./pages/FeedbackBuilder"));
const Chatbot = lazy(() => import("./pages/Chatbot"));
```

### 5.3 URL Structure

| Route | Description |
|-------|-------------|
| `/` | Landing page with features & CTA |
| `/login` | Email/password login |
| `/signup` | User registration |
| `/dashboard` | Project list (authenticated) |
| `/project/:id` | Project editor workspace |
| `/project/:id/preview` | Private blog preview |
| `/project/:id/feedback` | Feedback form builder |
| `/project/:id/chatbot` | Chatbot testing |
| `/p/:slug-:id` | Public shareable blog URL |

---

## 6. Pages & Components

### 6.1 Landing Page (`Index.tsx`)

**Purpose**: Marketing page with features, how-it-works, and CTA sections.

**Sections**:
- Hero with animated background orbs
- Features grid (6 items)
- How It Works (5 steps)
- CTA section
- Footer

**Key Elements**:
```tsx
const features = [
  { icon: FileText, title: "Auto-Generated Blog", ... },
  { icon: Bot, title: "Context-Aware Chatbot", ... },
  { icon: MessageCircle, title: "Structured Feedback", ... },
  { icon: Bell, title: "Gap Detection", ... },
  { icon: RefreshCw, title: "Learning Loop", ... },
  { icon: TrendingUp, title: "Validation Metrics", ... },
];
```

### 6.2 Dashboard (`Dashboard.tsx`)

**Purpose**: Project list with create, search, sort, and share functionality.

**Features**:
- Project cards with cover images
- Search & sort filters
- Create project dialog
- Shareable link copy button
- User dropdown menu

**Key State**:
```tsx
const [searchQuery, setSearchQuery] = useState("");
const [sortBy, setSortBy] = useState("recent");
const [isCreateOpen, setIsCreateOpen] = useState(false);
```

### 6.3 Project Editor (`Project.tsx`)

**Purpose**: Main workspace with tabbed navigation for all project features.

**Sidebar Navigation**:
```tsx
const sidebarItems = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "blog", label: "Blog Editor", icon: FileEdit },
  { id: "knowledge", label: "Knowledge Base", icon: Database },
  { id: "response", label: "Response", icon: MessageSquare },
  { id: "notification", label: "Notification", icon: Bell },
  { id: "chatbot", label: "Chatbot", icon: Bot },
  { id: "audience", label: "Audience Insights", icon: BarChart3 },
];
```

**Tab Content**:
- **Overview**: Validation Command Center (ProjectOverview component)
- **Blog**: Rich text editor with sections
- **Knowledge Base**: Document upload/management
- **Response**: User feedback viewer
- **Notification**: Unanswered questions list
- **Chatbot**: Bot testing interface
- **Audience**: Persona engagement analytics

### 6.4 Blog Preview (`BlogPreview.tsx`)

**Purpose**: Immersive reading experience with chatbot.

**Features**:
- 80vh parallax hero image
- Reading progress bar
- Floating section navigation
- Glassmorphism content cards
- Embedded chatbot section with FAQ chips
- Reading time estimation

**Key Effects**:
```tsx
// Parallax effect
style={{ transform: `translateY(${scrollY * 0.4}px)` }}

// Reading progress calculation
const progress = Math.min(100, Math.max(0, (scrolled / contentHeight) * 100));
```

### 6.5 Validation Command Center (`ProjectOverview.tsx`)

**Purpose**: Central dashboard for idea validation metrics and insights.

**Components Used**:
- `IdeaPulseCard` - Project status hero
- `AISummaryCard` - AI-generated insights
- `ValidationRing` - Visual flow diagram
- `IdeaHealthScore` - Health metrics (Clarity, Market Signal, Gap Velocity, Momentum)
- `GapDetectionPanel` - Active/resolved gaps
- `ConfusionAnalysis` - Confusion patterns
- `PersonaEngagementMatrix` - Audience segment analysis
- `IterationTimeline` - Change history

---

## 7. Hooks & State Management

### 7.1 Authentication (`useAuth.ts`)

```tsx
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    // ...
  }, []);

  return {
    user,
    session,
    loading,
    signUp: async (email, password) => { ... },
    signIn: async (email, password) => { ... },
    signOut: async () => { ... },
  };
};
```

### 7.2 Projects (`useProjects.ts`)

```tsx
export interface Project {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  one_line_summary: string | null;
  introduction: string | null;
  description: string | null;
  status: string;  // "DRAFT" | "ACTIVE" | "PUBLISHED"
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject: async (input) => { ... },
    updateProject: async (id, input) => { ... },
    deleteProject: async (id) => { ... },  // Soft delete
    getProject: async (id) => { ... },
    getPublicProject: async (slug) => { ... },
  };
};
```

### 7.3 Blogs (`useBlogs.ts`)

```tsx
export interface Blog {
  id: string;
  project_id: string;
  heading: string | null;
  cover_image_url: string | null;
  introduction: string | null;
  content: string | null;
  custom_fields: CustomField[];
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  type: string;  // "text" | "feedback"
  value: string;
  order: number;
}

export const useBlogs = () => {
  return {
    loading,
    error,
    getBlog: async (projectId) => { ... },
    upsertBlog: async (projectId, input) => { ... },  // Insert or update
    getPublicBlog: async (projectId) => { ... },
  };
};
```

### 7.4 Documents (`useDocuments.ts`)

```tsx
export interface Document {
  id: string;
  project_id: string;
  document_group_id: string;
  uploaded_by: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useDocuments = (projectId) => {
  return {
    documents,
    loading,
    uploading,
    error,
    uploadDocument: async (file) => { ... },
    replaceDocument: async (docId, file) => { ... },  // Version control
    deleteDocument: async (docId) => { ... },         // Soft delete
    renameDocument: async (docId, newName) => { ... },
  };
};
```

### 7.5 Cover Images (`useCoverImage.ts`)

```tsx
export const useCoverImage = (projectId) => {
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadCoverImage = async (file: File) => {
    // Validate size (max 5MB) and type
    // Upload to Supabase Storage
    // Store public URL in localStorage
  };

  return {
    coverImage,
    uploading,
    uploadCoverImage,
    removeCoverImage,
  };
};
```

---

## 8. Database Integration

### 8.1 Supabase Client

```tsx
// src/integrations/supabase/client.ts (auto-generated)
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

### 8.2 Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (synced from auth.users) |
| `projects` | Project metadata, slugs, status |
| `blogs` | Blog content (heading, intro, content, custom fields) |
| `documents` | Knowledge base files (versioned) |
| `audience_members` | Visitor tracking with personas |
| `audience_questions` | Questions asked via chatbot |
| `persona_insights` | AI-generated persona analysis |

### 8.3 Row Level Security (RLS)

All tables have RLS enabled. Example policies:
- Projects: Users can only see/edit their own projects
- Blogs: Linked to project ownership
- Documents: Linked to project ownership

---

## 9. Styling & Theming

### 9.1 Tailwind Configuration

```ts
// tailwind.config.ts
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        // ...
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
        // Note: UI uses rounded-none for flat design
      },
      // ...
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### 9.2 Global CSS Classes

```css
/* src/index.css */

/* Enterprise card - minimal shadow, subtle border */
.card-enterprise {
  @apply bg-card border border-border rounded;
  box-shadow: var(--shadow-sm);
}

/* Surface panel */
.surface {
  @apply bg-[hsl(var(--surface))];
}

/* Status indicators */
.status-success { @apply bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]; }
.status-warning { @apply bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]; }
.status-error { @apply bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]; }

/* Text hierarchy */
.text-secondary { color: hsl(var(--text-secondary)); }
.text-disabled { color: hsl(var(--text-disabled)); }

/* Animations */
.animate-fade { animation: fade 150ms ease-out; }
.animate-slide-down { animation: slide-down 150ms ease-out; }
```

### 9.3 Animation Keyframes

```css
@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

---

## 10. Workflow & User Flows

### 10.1 Core User Flow

```
Login → Dashboard → Create Project → Blog Editor
                         ↓
              Knowledge Base Upload (PDF/Doc/Text)
                         ↓
              Blog/Chatbot/Feedback Configuration
                         ↓
              Public Publishing (slug-based URL)
                         ↓
              Audience Interaction (Chatbot/Feedback)
                         ↓
              AI-Driven Gap Detection
                         ↓
              Founder Correction Loop
                         ↓
              Chatbot Re-training → REPEAT
```

### 10.2 Project Creation Flow

1. User clicks "New Project" on Dashboard
2. Fill in: Title, One-line Summary, Introduction, Description
3. Project created with `status: "DRAFT"`
4. Redirect to Project Editor (Overview tab)

### 10.3 Blog Publishing Flow

1. Add content in Blog Editor tab
2. Upload cover image
3. Add custom sections (feedback, etc.)
4. Click "Save" → Data stored in Supabase `blogs` table
5. Click "View Blog" → Preview at `/project/:id/preview`
6. Share via URL: `/p/:slug-:id`

### 10.4 Validation Loop

1. Visitors interact with public blog/chatbot
2. Questions logged to `audience_questions` table
3. AI analyzes patterns → Surfaces gaps in Overview
4. Founder addresses gaps via:
   - Knowledge base updates
   - Blog content revisions
5. Chatbot retrains with new knowledge
6. Repeat until validation metrics improve

---

## Appendix: File Quick Reference

### Critical Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component, routing |
| `src/main.tsx` | Entry point |
| `src/index.css` | Global styles, CSS variables |
| `tailwind.config.ts` | Tailwind configuration |
| `src/hooks/useAuth.ts` | Authentication logic |
| `src/hooks/useProjects.ts` | Project CRUD |
| `src/hooks/useBlogs.ts` | Blog content management |
| `src/pages/Project.tsx` | Main editor workspace |
| `src/pages/BlogPreview.tsx` | Blog display |

### Environment Variables

```env
VITE_SUPABASE_URL=https://giwqqpxjfmefoduruazf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=giwqqpxjfmefoduruazf
```

---

*Documentation generated for Neesh AI Frontend v1.0*
