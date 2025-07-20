import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Download, Filter } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import EmployeeCard from "@/components/employee-card";
import { useToast } from "@/hooks/use-toast";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: workCards } = useQuery({
    queryKey: ["/api/work-cards"],
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async () => {
      // This would open a form dialog in a real implementation
      toast({
        title: "Feature coming soon",
        description: "Employee addition form will be available in the next update.",
      });
    },
  });

  const exportEmployees = () => {
    toast({
      title: "Export started",
      description: "Employee list export has been initiated.",
    });
  };

  // Filter employees based on search and filters
  const filteredEmployees = (employees && Array.isArray(employees) ? employees : []).filter((employee: any) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === "all" || 
                             employee.department.toLowerCase() === departmentFilter.toLowerCase();
    
    const matchesStatus = statusFilter === "all" || 
                         employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  }) || [];

  // Calculate progress for each employee
  const getEmployeeProgress = (employeeId: number) => {
    if (!workCards || !Array.isArray(workCards)) return { completed: 0, total: 0, percentage: 0 };
    
    const employeeCards = workCards.filter((card: any) => card.assignedToId === employeeId);
    const completedCards = employeeCards.filter((card: any) => card.status === "completed");
    
    return {
      completed: completedCards.length,
      total: employeeCards.length,
      percentage: employeeCards.length > 0 ? Math.round((completedCards.length / employeeCards.length) * 100) : 0,
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-32 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--text-dark))] mb-2">Employee Management</h2>
          <p className="text-gray-600">Manage employee profiles and work assignments</p>
        </div>
        <Button onClick={() => addEmployeeMutation.mutate()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search employees by name, ID, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-break">On Break</SelectItem>
                  <SelectItem value="off-site">Off Site</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportEmployees}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Grid */}
      {filteredEmployees.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredEmployees.map((employee: any) => (
              <EmployeeCard 
                key={employee.id} 
                employee={employee}
                todayProgress={getEmployeeProgress(employee.id)}
              />
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center">
            <Button variant="outline">
              Load More Employees
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500 mb-2">
              {searchTerm || departmentFilter !== "all" || statusFilter !== "all" 
                ? "No employees match your search criteria" 
                : "No employees found"
              }
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {searchTerm || departmentFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search terms or filters"
                : "Add your first employee to get started"
              }
            </p>
            <Button onClick={() => addEmployeeMutation.mutate()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
