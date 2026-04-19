import { RouteObject } from "react-router-dom"
import Home from "./pages/Home"
import Course from "./pages/Course"
import Settings from "./pages/Settings"
import Layout from "./Layout"
import Signin from "./pages/Signin"
import Signup from "./pages/Signup"

export const routes: RouteObject[] = [
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: "/signup", element: <Signup /> },
            { path: "/signin", element: <Signin /> },
            { path: "/course", element: <Course /> },
            { path: "/settings", element: <Settings /> }
        ],
    },
]