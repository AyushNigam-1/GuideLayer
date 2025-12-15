import { ChangeEvent } from "react";
import { InputProps } from "../types"

const Input = ({ label, value, onChange, isTextArea, placeholder, disabled = false, className = "" }: InputProps & { className?: string }) => {
    const baseClasses = `
        w-full p-2 rounded-lg text-sm transition-colors 
        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
        focus:border-indigo-500
        
        /* Light Mode Defaults */
        bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-500 border
        
        /* Dark Mode Overrides */
        dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-400
        
        /* Disabled State */
        disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed
    `.replace(/\s+/g, ' ').trim(); // Clean up class names

    return (
        <div>
            {
                label &&
                // Label: Light default, Dark override
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label}
                </label>
            }
            {isTextArea ? <textarea
                id="step-text"
                rows={3}
                value={value}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(e) => onChange(e as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)}
                className={`${baseClasses} ${className}`}
            /> : <input
                type="text"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e as ChangeEvent<HTMLInputElement>)}
                className={`${baseClasses} ${className}`}
                placeholder={placeholder}
            />}

        </div>
    )
}

export default Input