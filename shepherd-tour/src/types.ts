import { StepOptions } from "shepherd.js";

export type Placement = 'top' | 'right' | 'bottom' | 'left';

export interface Step {
    _id: string;
    text: string; // Simplified to string for this UI's input
    image: string; // Placeholder for image URL
    element: string; // The CSS selector
    on: Placement;  // The guide popup alignment
    order_index: number
    course_id?: string
}

export interface StepData extends Partial<StepOptions> {
    _id: string
    text: [string] | string
    element?: string | HTMLElement
    on?: Placement
    buttonText?: string
}

export interface StepData {
    id: string,
    title: string,
    steps: Step[]
    // buttonText and complex text array handling omitted for UI simplicity
}

export type Message = { action: "startTour" | "openCreator" | "fetchCourses", courseId?: string } // 🛑 Update Message type
