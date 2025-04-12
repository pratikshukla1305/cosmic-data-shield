
import { ReactNode } from "react";
import { ReportProvider } from "../contexts/ReportContext";
import { Toaster } from "sonner";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ReportProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </div>
    </ReportProvider>
  );
}
