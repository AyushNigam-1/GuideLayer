import { createHashRouter, RouterProvider } from "react-router-dom"
import { routes } from "./routes"
const router = createHashRouter(routes)


export default function Popup() {
  return <RouterProvider router={router} />
}