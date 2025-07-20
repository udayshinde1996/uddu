import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface StatsOverviewProps {
  stats: {
    activeWorkers: number;
    completedToday: number;
    inProgress: number;
    overdue: number;
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const statItems = [
    {
      title: "Active Workers",
      value: stats.activeWorkers,
      icon: Users,
      color: "text-[hsl(var(--primary))]",
      bgColor: "bg-blue-100",
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: CheckCircle,
      color: "text-[hsl(var(--secondary))]",
      bgColor: "bg-green-100",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      color: "text-[hsl(var(--warning))]",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "text-[hsl(var(--error))]",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-2 ${item.bgColor} rounded-lg`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{item.title}</p>
                <p className="text-2xl font-bold text-[hsl(var(--text-dark))]">
                  {item.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
