import { InputProps } from "../types"

const Input = ({ label, value, onChange, isTextArea, placeholder, disabled = false, className = "" }: InputProps & { className?: string }) => {
    return <div>
        {
            label &&
            <label className="block text-sm font-medium text-gray-300 mb-1">
                {label}
            </label>
        }
        {isTextArea ? <textarea
            id="step-text"
            rows={3}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(e) => onChange(e)}
            className={`w-full p-2 border border-gray-600 rounded-lg text-sm bg-white/5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:outline-none ${className}`}
        /> : <input
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e)}
            className={`w-full p-2 border border-gray-600 rounded-lg text-sm bg-white/5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:outline-none ${className}`}
            placeholder={placeholder}
        />}

    </div>
}

export default Input