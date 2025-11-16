export type Placement = 'top' | 'right' | 'bottom' | 'left';

export interface Step {
    id: string;
    text: string; // Simplified to string for this UI's input
    image: string; // Placeholder for image URL
    attachTo?: {
        element: string; // The CSS selector
        on: Placement;  // The guide popup alignment
    };
}

export interface StepData {
    id: string,
    title: string,
    steps: Step[]
    // buttonText and complex text array handling omitted for UI simplicity
}