import { createClient } from "@supabase/supabase-js"
// import { Storage } from "@plasmohq/storage"

const storageAdapter = {
    getItem: (key: string) => chrome.storage.local.get([key]).then(result => result[key]),
    setItem: (key: string, value: string) => chrome.storage.local.set({ [key]: value }),
    removeItem: (key: string) => chrome.storage.local.remove([key])
}
export const supabaseUrl = "https://jyvyidejcnalevvtoxeg.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dnlpZGVqY25hbGV2dnRveGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNzgzODcsImV4cCI6MjA3ODg1NDM4N30.R4zCOC9jOrAnKibPGhvbmBrZOpuWPBoj_5yQ5Qncm0w"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false  // important for extensions
    }
})
// Auth helpers
export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: chrome.runtime.getURL('popup.html')  // Extension URL
        }
    })
    console.log("data", data)
    return { data, error }
}

export const getSession = () => supabase.auth.getSession()
export const signOut = () => supabase.auth.signOut()
