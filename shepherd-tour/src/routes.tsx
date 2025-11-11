import { createBrowserRouter, RouteObject } from "react-router-dom"
import Home from "./Home"  // Import components here
// import Preview from "./Preview"
// import Settings from "./Settings"

// Route config
export const routes: RouteObject[] = [
    { path: "/", element: <Home /> },
    //   { path: "/preview", element: <Preview /> },
    //   { path: "/settings", element: <Settings /> },
    //   { 
    //     path: "*",  // Catch-all 404
    //     element: <NotFound />
    //   }
]