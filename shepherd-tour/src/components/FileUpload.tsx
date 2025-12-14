import { Trash2 } from 'lucide-react'
import FilePreview from './FilePreview'
import Loading from './Loading'
import { MediaType } from '../types'


interface FileUploadProps {
    type: MediaType
    file: string | null
    isUploading: MediaType | null
    isDeleting: MediaType | null
    label: string
    handleFileChange: (
        e: React.ChangeEvent<HTMLInputElement>,
        type: MediaType
    ) => void
    handleDeleteFile: (filePath: string, type: MediaType) => void

}

const FileUpload: React.FC<FileUploadProps> = ({ isUploading, isDeleting, file, handleFileChange, handleDeleteFile, label, type }) => {
    return (
        <div >
            {/* Label: Light default (text-gray-700), Dark override (dark:text-gray-300) */}
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{label}</label>

            <div
                // Container: Light default, Dark override
                className="flex items-center space-x-2 
                           bg-white dark:bg-white/5 
                           text-gray-800 dark:text-gray-300 
                           rounded-lg border border-dashed 
                           border-gray-400 dark:border-gray-500 
                           cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
                <label className="flex-1 w-full text-sm flex items-center relative transition-colors cursor-pointer">
                    <input
                        type="file"
                        // accept="image/*"
                        onChange={(e) => handleFileChange(e, type)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={isUploading == type}
                    />
                    {isUploading == type ? (
                        <span className="flex items-center gap-2 justify-center text-indigo-600 dark:text-blue-400 w-full">
                            {/* Loading Spinner */}
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                        </span>
                    ) :
                        file ?
                            <>{file.slice(0, 20)}...</>
                            : <span
                                // Placeholder text: Light default, Dark override
                                className="flex items-center justify-center gap-2 w-full text-gray-500 dark:text-gray-400"
                            >
                                {/* Upload Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                </svg>
                                Click to select file
                            </span>}
                </label>
                {
                    file && (isDeleting == type ? <Loading /> :
                        <button
                            onClick={() => handleDeleteFile(file, type)}
                            // Delete button: Light default, Dark override
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )
                }
            </div>
            {/* FilePreview component (assuming it handles its own styling) */}
            <FilePreview urlPath={file!} mediaType={type} />
        </div>
    )
}

export default FileUpload