import { Outlet } from "react-router-dom"

const Layout = () => {
    return (
        <div
            className="min-w-[320px] bg-gray-900 text-white shadow-xl border-0 overflow-hidden p-4 "
        >
            <Outlet />
        </div>
    )
}

export default Layout