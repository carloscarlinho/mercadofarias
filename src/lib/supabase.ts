import { createBrowserClient } from '@supabase/ssr';

// Singleton client
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!client) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // During build/prerendering, env vars may not be available
        // Return a dummy client that won't be used (pages are "use client")
        if (!supabaseUrl || !supabaseAnonKey) {
            // Return a mock client for SSR/build - real client is created in browser
            return createBrowserClient(
                'https://placeholder.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
            );
        }

        client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    }
    return client;
}
