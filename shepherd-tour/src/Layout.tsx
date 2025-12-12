import { Outlet } from "react-router-dom"

const Layout = () => {
    return (
        <div
            className="min-w-[320px] dark:text-gray-900 text-white shadow-xl border-0 overflow-hidden  "
        >
            <Outlet />
        </div>
    )
}

export default Layout