const ImagePreview = ({ url }: { url: string }) => {
    if (!url) return null;
    return (
        <div className="mt-3 relative">
            <p className="text-xs font-medium text-gray-700 mb-1">Image Preview</p>
            <img
                src={url}
                alt="Step Visual Guide"
                className="w-full h-auto object-contain rounded-lg border border-gray-300 shadow-sm"
                onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x150/ef4444/ffffff?text=Image+Load+Error';
                }}
            />
        </div>
    );
};

export default ImagePreview