const API_URL = "http://localhost:4000"; // Adjust if your backend runs elsewhere

export interface VectorStep {
    text: string;
    metadata: {
        courseId: string;
        stepIndex: number;
        url: string;
        element: string;
        actionType: "click" | "input" | "wait";
        inputValue?: string;
    };
}

export const embedCourseSteps = async (courseId: string, steps: any[]) => {
    // 1. Transform your raw steps into "Documents" for the vector store
    // We mix the Course Title + Step Text into 'pageContent' so the AI finds it easily.
    const documents: VectorStep[] = steps.map((step, index) => ({
        text: `${step.text}`,
        metadata: {
            courseId: courseId,
            stepIndex: index,
            url: step.site_url,
            element: step.element,
            actionType: step.click_required ? "click" : step.input_required ? "input" : "wait",
            inputValue: step.input || ""
        }
    }));

    // 2. Send to backend
    const response = await fetch(`${API_URL}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents }),
    });

    if (!response.ok) {
        throw new Error("Failed to embed documents into vector store");
    }

    return await response.json();
};

export const searchVectorStore = async (userQuery: string, courseId?: string) => {
    const response = await fetch(`${API_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query: userQuery,
            courseId: courseId // <--- Send the specific course ID
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to search vector store");
    }

    return await response.json();
};

export const updateVectorStore = async (
    deleteIds: string[],
    newSteps: any[]
) => {
    const response = await fetch(`${API_URL}/api/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            deleteIds,
            newSteps
        }),
    });

    if (!response.ok) throw new Error("Failed to update vector store");
    return await response.json();
};
