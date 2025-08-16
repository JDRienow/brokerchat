-- Add Row Level Security to core tables
-- Enable RLS on brokers table
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brokers table
CREATE POLICY "Users can view own broker data" ON brokers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own broker data" ON brokers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all broker data" ON brokers
    FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on documents table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own documents" ON documents
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can insert own documents" ON documents
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update own documents" ON documents
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete own documents" ON documents
            FOR DELETE USING (auth.uid() = user_id);
            
        CREATE POLICY "Service role can manage all documents" ON documents
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Enable RLS on public_links table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'public_links') THEN
        ALTER TABLE public_links ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own public links" ON public_links
            FOR SELECT USING (auth.uid() = broker_id);
            
        CREATE POLICY "Users can insert own public links" ON public_links
            FOR INSERT WITH CHECK (auth.uid() = broker_id);
            
        CREATE POLICY "Users can update own public links" ON public_links
            FOR UPDATE USING (auth.uid() = broker_id);
            
        CREATE POLICY "Users can delete own public links" ON public_links
            FOR DELETE USING (auth.uid() = broker_id);
            
        CREATE POLICY "Service role can manage all public links" ON public_links
            FOR ALL USING (auth.role() = 'service_role');
            
        -- Allow public access to active links
        CREATE POLICY "Public can view active links" ON public_links
            FOR SELECT USING (is_active = true);
    END IF;
END $$; 