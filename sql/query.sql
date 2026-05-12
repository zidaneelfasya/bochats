-- User profiles with roles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Function to automatically create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE chatbots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(100) NOT NULL DEFAULT 'gpt-4-turbo',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    is_public BOOLEAN DEFAULT FALSE,
    personality TEXT,
    manual_knowledge TEXT,
    knowledge_url TEXT,
    welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
    fallback_message TEXT DEFAULT 'I apologize, but I could not find an answer to your question.',
    tone VARCHAR(50) DEFAULT 'Friendly',
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base files
CREATE TABLE chatbot_rag_files (
    chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
    original_name VARCHAR,
    unique_name VARCHAR,
    path_url TEXT,
    upload_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
);

-- Custom commands for chatbot
CREATE TABLE chatbot_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
    command_name VARCHAR(100) NOT NULL,
    command_description TEXT,
    command_action TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chatbot_telegram_bots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bot_token TEXT NOT NULL,
    bot_username TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    session BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chatbot_id, user_id)
);

-- Create table for storing Telegram conversations (optional, for analytics)
CREATE TABLE IF NOT EXISTS telegram_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
    telegram_user_id TEXT NOT NULL,
    telegram_chat_id TEXT NOT NULL,
    user_message TEXT,
    ai_response TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX(chatbot_id, timestamp),
    INDEX(telegram_chat_id, timestamp)
);

-- Create table for storing all chatbot conversations (widget, telegram, etc.)
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
    session_id TEXT, -- To group messages in a session (e.g., telegram chat id or widget session)
    source TEXT NOT NULL DEFAULT 'widget', -- e.g., 'telegram', 'widget', 'test'
    user_message TEXT,
    ai_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for User API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_value VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookup by key value when authenticating
CREATE INDEX IF NOT EXISTS idx_api_keys_key_value ON api_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Logging penggunaan API Key untuk monitoring, billing, dan rate limiting
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key_id UUID NOT NULL,
    api_key_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key_name_snapshot VARCHAR(255) NOT NULL,
    api_key_value_prefix VARCHAR(32) NOT NULL,
    chatbot_id UUID,
    chatbot_name_snapshot VARCHAR(255),
    session_id TEXT,
    source TEXT NOT NULL DEFAULT 'widget',
    request_path TEXT NOT NULL,
    request_method TEXT NOT NULL,
    request_ip TEXT,
    user_agent TEXT,
    message_length INTEGER NOT NULL DEFAULT 0,
    response_length INTEGER NOT NULL DEFAULT 0,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    token_source TEXT NOT NULL DEFAULT 'estimated',
    decision TEXT,
    response_time_ms INTEGER,
    is_success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_api_key_id ON api_key_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_user_id ON api_key_usage_logs(api_key_user_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_created_at ON api_key_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_logs_chatbot_id ON api_key_usage_logs(chatbot_id);

-- Ringkasan usage per API key untuk dashboard dan monitoring
CREATE OR REPLACE VIEW api_key_usage_summary AS
SELECT
    api_key_id,
    api_key_user_id,
    api_key_name_snapshot,
    api_key_value_prefix,
    MAX(created_at) AS last_used_at,
    COUNT(*)::INTEGER AS total_requests,
    COUNT(*) FILTER (WHERE is_success)::INTEGER AS successful_requests,
    COUNT(*) FILTER (WHERE NOT is_success)::INTEGER AS failed_requests,
    COALESCE(SUM(prompt_tokens), 0)::INTEGER AS prompt_tokens,
    COALESCE(SUM(completion_tokens), 0)::INTEGER AS completion_tokens,
    COALESCE(SUM(total_tokens), 0)::INTEGER AS total_tokens,
    COALESCE(AVG(response_time_ms), 0)::NUMERIC(12, 2) AS avg_response_time_ms
FROM api_key_usage_logs
GROUP BY api_key_id, api_key_user_id, api_key_name_snapshot, api_key_value_prefix;

