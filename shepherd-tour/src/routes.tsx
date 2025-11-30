import { RouteObject } from "react-router-dom"
import Home from "./pages/Home"  // Import components here
import Course from "./pages/Course"
import SupabaseAuth from "./pages/Auth"
import Settings from "./pages/Settings"
import Layout from "./Layout"

export const routes: RouteObject[] = [
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <SupabaseAuth /> },
            { path: "/home", element: <Home /> },
            { path: "/course", element: <Course /> },
            { path: "/settings", element: <Settings /> }
        ],
    },
]