
import { Outlet } from "react-router-dom";
import { ReportProvider } from "../contexts/ReportContext";
import { Toaster } from "sonner";

export default function AppLayout() {
  return (
    <ReportProvider>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
        <Toaster position="top-right" richColors closeButton />
      </div>
    </ReportProvider>
  );
}
