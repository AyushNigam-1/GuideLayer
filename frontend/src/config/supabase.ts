import { createClient } from "@supabase/supabase-js"

const storageAdapter = {
    getItem: (key: string) => chrome.storage.local.get([key]).then(result => result[key]),
    setItem: (key: string, value: string) => chrome.storage.local.set({ [key]: value }),
    removeItem: (key: string) => chrome.storage.local.remove([key])
}

export const supabase = createClient(process.env.PLASMO_PUBLIC_SUPABASE_URL!, process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY!, {
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
