import { InputProps } from "../types"

const Input = ({ label, value, onChange, isTextArea, placeholder, disabled = false }: InputProps) => {
    return <div>
        {
            label &&
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        /> : <input
            type="text"
            value={value}
            disabled={disabled}

            onChange={(e) => onChange(e)}
            className="w-full p-2 border rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder={placeholder}
        />}

    </div>
}

export default Input
