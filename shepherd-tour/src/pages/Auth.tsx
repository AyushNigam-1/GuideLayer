// src/components/Auth.tsx
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../config/supabase'

export default function SupabaseAuth() {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-white text-center mb-8">
                    Welcome to GuideLayer
                </h1>
                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#10b981',
                                    brandAccent: '#059669',
                                },
                            },
                        },
                    }}
                    providers={['google', 'github', 'apple']}
                    redirectTo={chrome.runtime.getURL('Home.html')} // or popup.html
                    onlyThirdPartyProviders={false}
                    view="magic_link" // or "sign_in", "sign_up"
                />
            </div>
        </div>
    )
}