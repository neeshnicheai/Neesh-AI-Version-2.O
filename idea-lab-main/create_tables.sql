-- Create missing tables for AI Service

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    question_text TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    ask_count INTEGER NOT NULL DEFAULT 1,
    notification_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (notification_status IN ('OPEN', 'RESOLVED', 'REOPENED')),
    first_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_project_normalized ON questions(project_id, normalized_text);

CREATE TABLE IF NOT EXISTS manual_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id),
    answer_text TEXT NOT NULL,
    answer_type TEXT NOT NULL DEFAULT 'SUPPLEMENT' CHECK (answer_type IN ('OVERRIDE', 'SUPPLEMENT')),
    created_by UUID NOT NULL REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS answer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id),
    answer_text TEXT NOT NULL,
    confidence_level TEXT NOT NULL,
    is_ai_answer BOOLEAN NOT NULL DEFAULT TRUE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id),
    answer_log_id UUID NOT NULL REFERENCES answer_logs(id),
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('POSITIVE', 'NEGATIVE')),
    comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
