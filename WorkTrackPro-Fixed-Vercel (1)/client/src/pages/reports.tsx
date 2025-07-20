import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Calendar, Filter, Trash2, Eye } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Reports() {
  const [reportType, setReportType] = useState("daily-summary");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [filterBy, setFilterBy] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/reports"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reports", {
        name: `${reportType.replace('-', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - ${new Date(dateFrom).toLocaleDateString()}`,
        type: reportType,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        filters: { filterBy },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report generation started",
        description: "Your report is being generated. You'll be notified when it's ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate report",
        description: error.message || "An error occurred while generating the report.",
        variant: "destructive",
      });
    },
  });

  const downloadReport = async (reportId: number, reportName: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`);
      if (!response.ok) {
        throw new Error("Failed to download report");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Your report download has begun.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "generating":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[hsl(var(--text-dark))] mb-4">Work Reports</h2>
        <p className="text-gray-600">Generate and download Excel reports of daily work activities</p>
      </div>

      {/* Report Generation Panel */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily-summary">Daily Work Summary</SelectItem>
                  <SelectItem value="weekly-summary">Weekly Work Summary</SelectItem>
                  <SelectItem value="employee-performance">Employee Performance</SelectItem>
                  <SelectItem value="project-progress">Project Progress</SelectItem>
                  <SelectItem value="material-usage">Material Usage</SelectItem>
                  <SelectItem value="safety-incidents">Safety Incidents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filter by</label>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => generateReportMutation.mutate()}
              disabled={generateReportMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              {generateReportMutation.isPending ? "Generating..." : "Generate Excel Report"}
            </Button>
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports && Array.isArray(reports) && reports.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report: any) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-gray-500">
                            {report.type.replace('-', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {report.type.replace('-', ' ')}
                      </TableCell>
                      <TableCell>
                        {formatDate(report.dateFrom)} - {formatDate(report.dateTo)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatTimeAgo(report.generatedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {report.status === "ready" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadReport(report.id, report.name)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-500 mb-2">No reports generated yet</div>
              <p className="text-sm text-gray-400 mb-4">Generate your first report using the form above</p>
              <Button onClick={() => generateReportMutation.mutate()}>
                <Download className="w-4 h-4 mr-2" />
                Generate First Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[hsl(var(--primary))]" />
                </div>
                <h4 className="ml-3 font-medium text-[hsl(var(--text-dark))]">Daily Summary</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Comprehensive daily work activity report with completion rates and hours worked
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Most popular</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setReportType("daily-summary");
                    toast({ title: "Template applied", description: "Daily summary template has been loaded." });
                  }}
                >
                  Use Template
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[hsl(var(--secondary))]" />
                </div>
                <h4 className="ml-3 font-medium text-[hsl(var(--text-dark))]">Employee Performance</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Individual employee metrics including productivity and work quality assessments
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">HR Approved</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setReportType("employee-performance");
                    toast({ title: "Template applied", description: "Employee performance template has been loaded." });
                  }}
                >
                  Use Template
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[hsl(var(--warning))]" />
                </div>
                <h4 className="ml-3 font-medium text-[hsl(var(--text-dark))]">Safety & Compliance</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Safety incidents, compliance checks, and equipment inspection reports
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Regulatory</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setReportType("safety-incidents");
                    toast({ title: "Template applied", description: "Safety & compliance template has been loaded." });
                  }}
                >
                  Use Template
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
