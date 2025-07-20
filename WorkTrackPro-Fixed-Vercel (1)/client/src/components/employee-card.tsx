import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, Briefcase, MapPin } from "lucide-react";

interface EmployeeCardProps {
  employee: {
    id: number;
    name: string;
    employeeId: string;
    department: string;
    location?: string;
    status: string;
    lastSeen: string;
  };
  todayProgress?: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export default function EmployeeCard({ employee, todayProgress }: EmployeeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "on-break":
        return "bg-yellow-100 text-yellow-800";
      case "off-site":
        return "bg-blue-100 text-blue-800";
      case "unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department.toLowerCase()) {
      case "construction":
        return "department-construction";
      case "electrical":
        return "department-electrical";
      case "plumbing":
        return "department-plumbing";
      case "hvac":
        return "department-hvac";
      case "safety":
        return "department-safety";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatLastSeen = (timestamp: string) => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    return lastSeen.toLocaleDateString();
  };

  const progress = todayProgress || { completed: 0, total: 0, percentage: 0 };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-[hsl(var(--text-dark))]">
              {employee.name}
            </h3>
            <p className="text-sm text-gray-500">{employee.employeeId}</p>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
            <Badge className={getDepartmentColor(employee.department)}>
              {employee.department}
            </Badge>
          </div>
          
          {employee.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
              <span>{employee.location}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(employee.status)}>
              {employee.status.charAt(0).toUpperCase() + employee.status.slice(1).replace('-', ' ')}
            </Badge>
            <span className="text-xs text-gray-500">
              {formatLastSeen(employee.lastSeen)}
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Today's Progress</span>
            <span className="font-medium text-[hsl(var(--text-dark))]">
              {progress.completed}/{progress.total} tasks
            </span>
          </div>
          <Progress value={progress.percentage} className="mb-3" />
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              View Details
            </Button>
            <Button variant="outline" size="sm">
              Assign Work
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
