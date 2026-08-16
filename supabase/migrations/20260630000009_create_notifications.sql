-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read notifications
CREATE POLICY "Enable read access for all users" ON public.notifications
    FOR SELECT USING (true);

-- Allow all authenticated users to insert notifications
CREATE POLICY "Enable insert access for all users" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Allow all authenticated users to update notifications (e.g., mark as read)
CREATE POLICY "Enable update access for all users" ON public.notifications
    FOR UPDATE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
