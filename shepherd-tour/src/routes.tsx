import { RouteObject } from "react-router-dom"
import Home from "./Home"  // Import components here
import Course from "./Course"
import Layout from "./Layout"

export const routes: RouteObject[] = [
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: "/course", element: <Course /> }
        ],
    },

]