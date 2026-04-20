import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { authClient } from "../lib/auth-client"

export default function Signin() {
    const nav = useNavigate()
    const [googleLoading, setGoogleLoading] = useState(false)
    const [emailLoading, setEmailLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [authError, setAuthError] = useState("")

    const signInWithGoogle = async () => {
        setAuthError("")
        setGoogleLoading(true)
        try {
            const response = await fetch("http://localhost:4000/api/auth/sign-in/social", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    provider: "google",
                    callbackURL: "http://localhost:4000/auth-success"
                })
            });

            const data = await response.json();

            if (data.url) {
                chrome.tabs.create({ url: data.url });
            }
        } catch (error) {
            console.error("Google Sign-in Error:", error);
            setAuthError("Failed to initialize Google Sign-In")
        } finally {
            setGoogleLoading(false)
        }
    }

    const signInWithEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthError("")
        setEmailLoading(true)

        const { error } = await authClient.signIn.email({
            email,
            password,
        })

        if (error) {
            setAuthError(error.message || "Invalid credentials")
            setEmailLoading(false)
        } else {
            nav("/")
        }
    }

    return (
        <div className="bg-white dark:bg-gray-900 space-y-3 text-gray-900 dark:text-white flex flex-col p-3 min-w-[300px]">

            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-600 dark:text-gray-200">
                    GuideLayer
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                    Signin to create your tour
                </p>
            </div>

            <div className="flex-1 space-y-4 mt-4 px-2">
                <button
                    onClick={signInWithGoogle}
                    disabled={googleLoading || emailLoading}
                    className="w-full flex items-center justify-center py-3 text-sm font-medium rounded-lg transition-all 
          bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300
          dark:bg-white/5 dark:text-white dark:border-gray-700 dark:hover:bg-white/10 disabled:opacity-50"
                >
                    {googleLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <span className="gap-2 flex items-center">
                            <img width="20" height="20" src="https://img.icons8.com/color/20/google-logo.png" alt="google-logo" />
                            Sign in with Google
                        </span>
                    )}
                </button>

                <div className="flex items-center">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                </div>

                <form onSubmit={signInWithEmail} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                        />
                    </div>

                    {authError && (
                        <p className="text-red-500 text-sm text-center">{authError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={googleLoading || emailLoading}
                        className="w-full flex justify-center items-center py-3 text-sm font-medium rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50"
                    >
                        {emailLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "Sign In"
                        )}
                    </button>

                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                        Don't have an account?{" "}
                        <button
                            type="button"
                            onClick={() => nav("/signup")}
                            className="text-indigo-500 hover:underline font-medium"
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}