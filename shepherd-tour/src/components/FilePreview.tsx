const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|avi|m4v)$/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|tiff)$/i;

const FilePreview = ({ urlPath }: { urlPath: string }) => {
    // console.log(urlPath)
    const fullPath = `https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${urlPath}`

    console.log("working", fullPath)
    if (!urlPath) return null;

    // Use a URL object to handle potential query parameters (like ?v=123)
    // const urlPath = new URL(url).pathname;

    const isVideo = VIDEO_EXTENSIONS.test(urlPath);
    const isImage = IMAGE_EXTENSIONS.test(urlPath);

    const commonClasses = "w-full h-auto object-contain rounded-lg border border-gray-300 shadow-sm";
    const errorPlaceholderUrl = 'https://placehold.co/400x150/ef4444/ffffff?text=Media+Load+Error';


    if (isVideo) {
        // Render a video element with controls
        return (
            <div className="mt-3 relative">
                <p className="text-xs font-medium text-gray-700 mb-1">Video Preview</p>
                <video
                    src={fullPath}
                    controls
                    className={`${commonClasses} bg-black`}
                >
                    Your browser does not support the video tag for this file type.
                </video>
            </div>
        );
    }

    // Default to image if it's an image or if the type is unknown (relying on onError)
    if (isImage || !isVideo) {
        return (
            <div className="mt-3 relative">
                <p className="text-xs font-medium text-gray-700 mb-1">Image Preview</p>
                <img
                    src={fullPath}
                    alt="Step Visual Guide"
                    className={commonClasses}
                    onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = errorPlaceholderUrl;
                    }}
                />
            </div>
        );
    }

    // Fallback if the URL exists but is neither a recognized image nor video extension
    return (
        <div className="mt-3 text-red-500 text-sm">
            Unsupported media type detected for the URL: {`https://jyvyidejcnalevvtoxeg.supabase.co/storage/v1/object/public/images/${urlPath}`}
        </div>
    );
};

export default FilePreview;