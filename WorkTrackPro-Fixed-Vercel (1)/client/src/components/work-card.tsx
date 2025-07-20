import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Clock } from "lucide-react";

interface WorkCardProps {
  workCard: {
    id: number;
    cardId: string;
    title: string;
    description: string;
    status: string;
    location: string;
    assignedTo?: {
      name: string;
    };
    completedAt?: string;
    startedAt?: string;
    deadline?: string;
  };
}

export default function WorkCard({ workCard }: WorkCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "in-progress":
        return "status-in-progress";
      case "assigned":
        return "status-assigned";
      case "overdue":
        return "status-overdue";
      case "on-hold":
        return "status-on-hold";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = workCard.status === "overdue" || 
    (workCard.deadline && new Date(workCard.deadline) < new Date() && workCard.status !== "completed");

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge className={getStatusColor(workCard.status)}>
            {workCard.status.charAt(0).toUpperCase() + workCard.status.slice(1).replace('-', ' ')}
          </Badge>
          <span className="text-sm text-gray-500">{workCard.cardId}</span>
        </div>
        
        <h3 className="font-medium text-[hsl(var(--text-dark))] mb-2">
          {workCard.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {workCard.description}
        </p>
        
        <div className="space-y-2">
          {workCard.assignedTo && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2" />
              <span>{workCard.assignedTo.name}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{workCard.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              {workCard.completedAt 
                ? `Completed at ${formatTime(workCard.completedAt)}`
                : workCard.startedAt 
                ? `Started at ${formatTime(workCard.startedAt)}`
                : workCard.deadline
                ? `Due: ${formatTime(workCard.deadline)}`
                : "No timeline set"
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
