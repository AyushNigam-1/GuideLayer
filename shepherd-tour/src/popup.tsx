import { createHashRouter, RouterProvider } from "react-router-dom"
import { routes } from "./routes"  // Import routes here
import type { PlasmoCSConfig } from "plasmo"
const router = createHashRouter(routes)
export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/*"]
}

export default function Popup() {
  return <RouterProvider router={router} />
}