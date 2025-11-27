import { RouteObject } from "react-router-dom"
import Home from "./pages/Home"  // Import components here
import Course from "./pages/Course"
import Layout from "./Layout"
import SupabaseAuth from "./pages/Auth"

export const routes: RouteObject[] = [
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <SupabaseAuth /> },
            { path: "/home", element: <Home /> },
            { path: "/course", element: <Course /> }
        ],
    },

]