
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

// Mock data for reports by status
const reportStatusData = [
  { name: 'Submitted', value: 14 },
  { name: 'Under Review', value: 8 },
  { name: 'Investigating', value: 10 },
  { name: 'Resolved', value: 6 },
  { name: 'Rejected', value: 2 },
];

// Mock data for reports by crime type
const crimeTypeData = [
  { name: 'Theft', value: 12 },
  { name: 'Assault', value: 8 },
  { name: 'Vandalism', value: 7 },
  { name: 'Fraud', value: 5 },
  { name: 'Other', value: 8 },
];

// Mock data for reports over time
const reportsOverTimeData = [
  { month: 'Jan', reports: 5 },
  { month: 'Feb', reports: 8 },
  { month: 'Mar', reports: 12 },
  { month: 'Apr', reports: 10 },
  { month: 'May', reports: 15 },
  { month: 'Jun', reports: 18 },
];

// Colors for pie charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardStats() {
  // Calculate percentages for the progress bars
  const totalSubmissions = 40;
  const resolutionRate = 65; // 65% resolution rate
  const responseTime = 80; // 80% fast response time
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Submissions" value={totalSubmissions} />
        <StatCard title="Resolution Rate" value={`${resolutionRate}%`} progress={resolutionRate} />
        <StatCard title="Response Time" value="Within 24 hrs" progress={responseTime} />
      </div>
      
      <Tabs defaultValue="status">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">By Status</TabsTrigger>
          <TabsTrigger value="type">By Crime Type</TabsTrigger>
          <TabsTrigger value="time">Over Time</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} reports`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="type" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports by Crime Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={crimeTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {crimeTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} reports`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="time" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportsOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="reports" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple stat card component
function StatCard({ title, value, progress }: { title: string; value: string | number; progress?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {progress !== undefined && (
          <Progress value={progress} className="mt-2 h-2" />
        )}
      </CardContent>
    </Card>
  );
}
