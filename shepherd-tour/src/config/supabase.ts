import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://jyvyidejcnalevvtoxeg.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dnlpZGVqY25hbGV2dnRveGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzgzODcsImV4cCI6MjA3ODg1NDM4N30.R4zCOC9jOrAnKibPGhvbmBrZOpuWPBoj_5yQ5Qncm0w"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false  // important for extensions
    }
})
