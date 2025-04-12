
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import NewReportForm from "../components/NewReportForm";
import DashboardStats from "../components/DashboardStats";
import { getMockCurrentUser } from "../services/authService";
import { FileText, Map, Bell, Shield } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getMockCurrentUser();

  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      navigate("/signin");
    }
  }, [user, navigate]);

  if (!user) {
    return null; // or loading state
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.displayName}. Submit reports and check their status here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Submit a Report"
          description="Report an incident or crime"
          icon={<FileText className="h-6 w-6" />}
          onClick={() => navigate("/reports")}
        />
        <DashboardCard
          title="View Crime Map"
          description="See incidents in your area"
          icon={<Map className="h-6 w-6" />}
          onClick={() => navigate("/heatmap")}
        />
        <DashboardCard
          title="Advisories"
          description="Latest safety advisories"
          icon={<Bell className="h-6 w-6" />}
          onClick={() => navigate("/advisory")}
        />
        <DashboardCard
          title="Police Stations"
          description="Find police stations near you"
          icon={<Shield className="h-6 w-6" />}
          onClick={() => navigate("/police-stations")}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <NewReportForm />
        </div>
        <div>
          <DashboardStats />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <div className="mr-2 rounded-md bg-primary/10 p-2">{icon}</div>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" size="sm" onClick={onClick} className="w-full">
          Access
        </Button>
      </CardContent>
    </Card>
  );
}
