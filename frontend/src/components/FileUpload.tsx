import { Loader2, Trash2, Upload } from 'lucide-react'
import FilePreview from './FilePreview'
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

    const getAcceptTypes = () => {
        if (type === 'audio') return 'audio/*';
        if (type === 'icon') return 'image/*';
        return 'image/*,video/*';
    };

    return (
        <div>
            <label className="block text-sm font-bold mb-1 text-gray-600 dark:text-gray-300">{label}</label>

            <div
                className="flex items-center space-x-2 
                           bg-white dark:bg-white/5 
                           text-gray-800 dark:text-gray-300 
                           rounded-lg border border-dashed 
                           border-gray-400 dark:border-gray-500 
                           cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors h-10"
            >
                <label className="flex-1 w-full text-sm flex items-center h-full relative transition-colors cursor-pointer">
                    <input
                        type="file"
                        accept={getAcceptTypes()}
                        onChange={(e) => handleFileChange(e, type)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={isUploading === type}
                    />
                    {isUploading === type ? (
                        <span className="flex items-center gap-2 justify-center text-indigo-600 dark:text-blue-400 w-full">
                            <Loader2 className="animate-spin h-4 w-4" />
                            Uploading...
                        </span>
                    ) : file ? (
                        <span className="truncate pr-2">{file.slice(0, 20)}...</span>
                    ) : (
                        <span className="flex items-center justify-center gap-2 w-full text-gray-500 dark:text-gray-400">
                            <Upload className="w-4 h-4" />
                            Click to select file
                        </span>
                    )}
                </label>

                {file && (
                    <div className="flex items-center justify-center w-6 h-6">
                        {isDeleting === type ? (
                            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteFile(file, type);
                                }}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
            <FilePreview urlPath={file!} mediaType={type} />
        </div>
    )
}

export default FileUpload