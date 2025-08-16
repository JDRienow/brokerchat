-- Create error_logs table for storing application errors
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES brokers(id) ON DELETE SET NULL,
    user_email TEXT,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component_stack TEXT,
    url TEXT,
    user_agent TEXT,
    environment TEXT DEFAULT 'production',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_environment ON error_logs(environment);

-- Add RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own errors
CREATE POLICY "Users can insert their own error logs" ON error_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert all error logs
CREATE POLICY "Service role can insert all error logs" ON error_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Allow service role to read all error logs
CREATE POLICY "Service role can read all error logs" ON error_logs
    FOR SELECT USING (auth.role() = 'service_role');

-- Allow users to read their own error logs
CREATE POLICY "Users can read their own error logs" ON error_logs
    FOR SELECT USING (auth.uid() = user_id); 