import { createHashRouter, RouterProvider } from "react-router-dom"
import { routes } from "./routes"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const router = createHashRouter(routes)

const queryClient = new QueryClient();

export default function Popup() {
  return <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
}