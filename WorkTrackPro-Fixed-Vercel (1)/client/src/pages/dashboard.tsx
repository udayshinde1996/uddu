import { useQuery } from "@tanstack/react-query";
import { Plus, QrCode, FileText, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import StatsOverview from "@/components/stats-overview";
import WorkCard from "@/components/work-card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Dashboard() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: workCards, isLoading: cardsLoading } = useQuery({
    queryKey: ["/api/work-cards"],
  });

  const handleCreateWorkCard = () => {
    toast({
      title: "Feature coming soon",
      description: "Work card creation interface will be available in the next update.",
    });
  };

  const handleGenerateReport = () => {
    toast({
      title: "Generating report",
      description: "Daily report generation started. You'll be notified when ready.",
    });
  };

  if (statsLoading || cardsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Stats Overview */}
      <div className="mb-8">
        <StatsOverview stats={stats || { activeWorkers: 0, completedToday: 0, inProgress: 0, overdue: 0 }} />
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={handleCreateWorkCard}
              className="flex items-center justify-center p-4 h-auto bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Work Card
            </Button>
            
            <Link href="/scanner">
              <Button 
                variant="secondary"
                className="flex items-center justify-center p-4 h-auto w-full bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90"
              >
                <QrCode className="w-5 h-5 mr-2" />
                QR Scanner
              </Button>
            </Link>
            
            <Button 
              onClick={handleGenerateReport}
              variant="secondary"
              className="flex items-center justify-center p-4 h-auto bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/90"
            >
              <FileText className="w-5 h-5 mr-2" />
              Daily Report
            </Button>
            
            <Link href="/employees">
              <Button 
                variant="outline"
                className="flex items-center justify-center p-4 h-auto w-full"
              >
                <Users className="w-5 h-5 mr-2" />
                Manage Team
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Today's Work Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today's Work Cards</CardTitle>
            <div className="flex items-center space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {workCards && Array.isArray(workCards) && workCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workCards.map((card: any) => (
                <WorkCard key={card.id} workCard={card} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-2">No work cards found</div>
              <Button onClick={handleCreateWorkCard}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Work Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
