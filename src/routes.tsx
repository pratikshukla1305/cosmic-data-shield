
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import MyReports from "./pages/MyReports";
import Profile from "./pages/Profile";
import CaseHeatmap from "./pages/CaseHeatmap";
import PoliceStationsMap from "./pages/PoliceStationsMap";
import HelpUsPage from "./pages/HelpUsPage";
import AdvisoryPage from "./pages/AdvisoryPage";
import NotFound from "./pages/NotFound";
import OfficerDashboard from "./pages/OfficerDashboard";
import OfficerLogin from "./pages/OfficerLogin";
import EKycPage from "./pages/EKycPage";
import SubmitTipPage from "./pages/SubmitTipPage";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "signin",
        element: <SignIn />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute>
            <MyReports />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "heatmap",
        element: <CaseHeatmap />,
      },
      {
        path: "police-stations",
        element: <PoliceStationsMap />,
      },
      {
        path: "help-us",
        element: <HelpUsPage />,
      },
      {
        path: "advisory",
        element: <AdvisoryPage />,
      },
      {
        path: "officer/login",
        element: <OfficerLogin />,
      },
      {
        path: "officer/dashboard",
        element: <OfficerDashboard />,
      },
      {
        path: "ekyc",
        element: <EKycPage />,
      },
      {
        path: "submit-tip",
        element: <SubmitTipPage />,
      },
      {
        path: "case-heatmap",
        element: <CaseHeatmap />,
      },
      {
        path: "home",
        element: <Home />,
      }
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
