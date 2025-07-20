import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Camera, Plus, Minus } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const completionSchema = z.object({
  status: z.enum(["started", "in-progress", "completed", "on-hold", "requires-review"]),
  hoursWorked: z.number().min(0).max(24),
  notes: z.string().min(1, "Work notes are required"),
  materials: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().min(0),
  })).optional(),
  // Manufacturing-specific fields
  shiftTime: z.string().min(1, "Shift time is required"),
  machineSlots: z.array(z.object({
    machineNumber: z.string().min(1, "Machine number required"),
    operationNumber: z.string().min(1, "Operation number required"),
    timeWorked: z.number().min(0, "Time worked must be positive"),
  })).min(1, "At least one machine slot is required").max(4, "Maximum 4 machine slots allowed"),
  totalWorkHours: z.number().min(0, "Total work hours must be positive"),
  timeLossActivities: z.array(z.object({
    activity: z.string().min(1, "Activity description required"),
    duration: z.number().min(0, "Duration must be positive"),
    issueType: z.string().min(1, "Issue type required"),
  })).optional(),
  defectivePartNumbers: z.array(z.string()).optional(),
  // Overtime fields
  isOvertime: z.boolean().default(false),
  overtimeHours: z.number().min(0).optional(),
  overtimeShiftTime: z.string().optional(),
  overtimeMachineSlots: z.array(z.object({
    machineNumber: z.string().min(1, "Machine number required"),
    operationNumber: z.string().min(1, "Operation number required"),
    timeWorked: z.number().min(0, "Time worked must be positive"),
  })).optional(),
}).refine((data) => {
  // If overtime is selected, require all overtime fields
  if (data.isOvertime) {
    return data.overtimeHours && data.overtimeHours > 0 &&
           data.overtimeShiftTime && data.overtimeShiftTime.length > 0 &&
           data.overtimeMachineSlots && data.overtimeMachineSlots.length >= 1;
  }
  return true;
}, {
  message: "All overtime fields are required when overtime is selected",
  path: ["isOvertime"]
});

type CompletionFormData = z.infer<typeof completionSchema>;

interface WorkCompletionFormProps {
  workCard: {
    id: number;
    cardId: string;
    title: string;
    description: string;
    assignedTo?: {
      name: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkCompletionForm({ workCard, isOpen, onClose }: WorkCompletionFormProps) {
  const [materials, setMaterials] = useState([{ name: "", quantity: 0 }]);
  const [machineSlots, setMachineSlots] = useState([{ machineNumber: "", operationNumber: "", timeWorked: 0 }]);
  const [timeLossActivities, setTimeLossActivities] = useState([{ activity: "", duration: 0, issueType: "" }]);
  const [defectivePartNumbers, setDefectivePartNumbers] = useState([""]);
  const [overtimeMachineSlots, setOvertimeMachineSlots] = useState([{ machineNumber: "", operationNumber: "", timeWorked: 0 }]);
  const [overtimeTimeLossActivities, setOvertimeTimeLossActivities] = useState([{ activity: "", duration: 0, issueType: "" }]);
  const [overtimeDefectivePartNumbers, setOvertimeDefectivePartNumbers] = useState([""]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompletionFormData>({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      status: "started",
      hoursWorked: 0,
      notes: "",
      materials: [],
      shiftTime: "",
      machineSlots: [{ machineNumber: "", operationNumber: "", timeWorked: 0 }],
      totalWorkHours: 0,
      timeLossActivities: [],
      defectivePartNumbers: [],
      isOvertime: false,
      overtimeHours: 0,
      overtimeShiftTime: "",
      overtimeMachineSlots: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: CompletionFormData) => {
      const response = await apiRequest(
        "POST",
        `/api/work-cards/${workCard.id}/complete`,
        {
          ...data,
          materials: materials.filter(m => m.name.trim() !== ""),
          machineSlots: machineSlots.filter(m => m.machineNumber.trim() !== "" || m.operationNumber.trim() !== ""),
          timeLossActivities: timeLossActivities.filter(t => t.activity.trim() !== ""),
          defectivePartNumbers: defectivePartNumbers.filter(p => p.trim() !== ""),
          overtimeMachineSlots: data.isOvertime ? overtimeMachineSlots.filter(m => m.machineNumber.trim() !== "" || m.operationNumber.trim() !== "") : [],
          overtimeTimeLossActivities: data.isOvertime ? overtimeTimeLossActivities.filter(t => t.activity.trim() !== "") : [],
          overtimeDefectivePartNumbers: data.isOvertime ? overtimeDefectivePartNumbers.filter(p => p.trim() !== "") : [],
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-sessions/recent"] });
      toast({
        title: "Work card updated",
        description: "Work progress has been recorded successfully.",
      });
      onClose();
      form.reset();
      setMaterials([{ name: "", quantity: 0 }]);
      setMachineSlots([{ machineNumber: "", operationNumber: "", timeWorked: 0 }]);
      setTimeLossActivities([{ activity: "", duration: 0, issueType: "" }]);
      setDefectivePartNumbers([""]);
      setOvertimeMachineSlots([{ machineNumber: "", operationNumber: "", timeWorked: 0 }]);
      setOvertimeTimeLossActivities([{ activity: "", duration: 0, issueType: "" }]);
      setOvertimeDefectivePartNumbers([""]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update work card",
        description: error.message || "An error occurred while updating the work card.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompletionFormData) => {
    submitMutation.mutate(data);
  };

  const addMaterial = () => {
    setMaterials([...materials, { name: "", quantity: 0 }]);
  };

  const removeMaterial = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  // Time loss activities management
  const addTimeLossActivity = () => {
    setTimeLossActivities([...timeLossActivities, { activity: "", duration: 0, issueType: "" }]);
  };

  const updateTimeLossActivity = (index: number, field: string, value: string | number) => {
    const updated = [...timeLossActivities];
    updated[index] = { ...updated[index], [field]: value };
    setTimeLossActivities(updated);
  };

  const removeTimeLossActivity = (index: number) => {
    if (timeLossActivities.length > 1) {
      setTimeLossActivities(timeLossActivities.filter((_, i) => i !== index));
    }
  };

  // Defective part numbers management
  const addDefectivePartNumber = () => {
    setDefectivePartNumbers([...defectivePartNumbers, ""]);
  };

  const updateDefectivePartNumber = (index: number, value: string) => {
    const updated = [...defectivePartNumbers];
    updated[index] = value;
    setDefectivePartNumbers(updated);
  };

  const removeDefectivePartNumber = (index: number) => {
    if (defectivePartNumbers.length > 1) {
      setDefectivePartNumbers(defectivePartNumbers.filter((_, i) => i !== index));
    }
  };

  // Overtime time loss activities management
  const addOvertimeTimeLossActivity = () => {
    setOvertimeTimeLossActivities([...overtimeTimeLossActivities, { activity: "", duration: 0, issueType: "" }]);
  };

  const updateOvertimeTimeLossActivity = (index: number, field: string, value: string | number) => {
    const updated = [...overtimeTimeLossActivities];
    updated[index] = { ...updated[index], [field]: value };
    setOvertimeTimeLossActivities(updated);
  };

  const removeOvertimeTimeLossActivity = (index: number) => {
    if (overtimeTimeLossActivities.length > 1) {
      setOvertimeTimeLossActivities(overtimeTimeLossActivities.filter((_, i) => i !== index));
    }
  };

  // Overtime defective part numbers management
  const addOvertimeDefectivePartNumber = () => {
    setOvertimeDefectivePartNumbers([...overtimeDefectivePartNumbers, ""]);
  };

  const updateOvertimeDefectivePartNumber = (index: number, value: string) => {
    const updated = [...overtimeDefectivePartNumbers];
    updated[index] = value;
    setOvertimeDefectivePartNumbers(updated);
  };

  const removeOvertimeDefectivePartNumber = (index: number) => {
    if (overtimeDefectivePartNumbers.length > 1) {
      setOvertimeDefectivePartNumbers(overtimeDefectivePartNumbers.filter((_, i) => i !== index));
    }
  };

  const updateMaterial = (index: number, field: keyof typeof materials[0], value: string | number) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  if (!isOpen) return null;

  // Machine slots management
  const addMachineSlot = () => {
    if (machineSlots.length < 4) {
      setMachineSlots([...machineSlots, { machineNumber: "", operationNumber: "", timeWorked: 0 }]);
    }
  };

  const updateMachineSlot = (index: number, field: string, value: string | number) => {
    const updated = [...machineSlots];
    updated[index] = { ...updated[index], [field]: value };
    setMachineSlots(updated);
  };

  const removeMachineSlot = (index: number) => {
    if (machineSlots.length > 1) {
      setMachineSlots(machineSlots.filter((_, i) => i !== index));
    }
  };

  // Overtime machine slots management
  const addOvertimeMachineSlot = () => {
    if (overtimeMachineSlots.length < 4) {
      setOvertimeMachineSlots([...overtimeMachineSlots, { machineNumber: "", operationNumber: "", timeWorked: 0 }]);
    }
  };

  const updateOvertimeMachineSlot = (index: number, field: string, value: string | number) => {
    const updated = [...overtimeMachineSlots];
    updated[index] = { ...updated[index], [field]: value };
    setOvertimeMachineSlots(updated);
  };

  const removeOvertimeMachineSlot = (index: number) => {
    if (overtimeMachineSlots.length > 1) {
      setOvertimeMachineSlots(overtimeMachineSlots.filter((_, i) => i !== index));
    }
  };

  const issueTypes = [
    { value: "100", label: "100 Assembly damage" },
    { value: "101", label: "101 Wrong assembly" },
    { value: "110", label: "110 Vendor issue" },
    { value: "111", label: "111 Quality issue" },
    { value: "112", label: "112 Design issue" },
    { value: "120", label: "120 Material shortage" },
    { value: "121", label: "121 Material anomaly" },
    { value: "130", label: "130 Tools/equipment" },
    { value: "140", label: "140 Break down" },
    { value: "150", label: "150 Development hours" },
    { value: "180", label: "180 PDI" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-screen overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Complete Work Card</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-[hsl(var(--text-dark))] mb-2">
              {workCard.title}
            </h4>
            <p className="text-sm text-gray-600 mb-2">{workCard.description}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span>{workCard.cardId}</span>
              {workCard.assignedTo && (
                <>
                  <span className="mx-2">•</span>
                  <span>Assigned to {workCard.assignedTo.name}</span>
                </>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="started">Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="requires-review">Requires Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <FormField
                control={form.control}
                name="hoursWorked"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours Worked</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="e.g., 8.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Manufacturing-specific fields */}
              <div className="border-t pt-4 mt-6">
                <h3 className="text-lg font-medium mb-4 text-[hsl(var(--text-dark))]">Manufacturing Details</h3>
                
                <FormField
                  control={form.control}
                  name="shiftTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Time</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shift..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="first-shift">First Shift (7:00 AM - 3:30 PM)</SelectItem>
                          <SelectItem value="general-shift">General Shift (8:00 AM - 4:30 PM)</SelectItem>
                          <SelectItem value="second-shift">Second Shift (3:00 PM - 11:30 PM)</SelectItem>
                          <SelectItem value="night-shift">Night Shift (11:00 PM - 7:30 AM)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Machine Slots Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Machine & Operation Details (Max 4 slots)</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMachineSlot}
                      disabled={machineSlots.length >= 4}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slot
                    </Button>
                  </div>
                  {machineSlots.map((slot, index) => (
                    <Card key={index} className="p-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Input
                            placeholder="Machine #"
                            value={slot.machineNumber}
                            onChange={(e) => updateMachineSlot(index, "machineNumber", e.target.value)}
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Operation #"
                            value={slot.operationNumber}
                            onChange={(e) => updateMachineSlot(index, "operationNumber", e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Hours"
                            value={slot.timeWorked}
                            onChange={(e) => updateMachineSlot(index, "timeWorked", parseFloat(e.target.value) || 0)}
                          />
                          {machineSlots.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMachineSlot(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="totalWorkHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Work Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          max="12"
                          placeholder="e.g., 8.75"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Overtime Section */}
              <div className="border-t pt-4 mt-6">
                <FormField
                  control={form.control}
                  name="isOvertime"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Overtime Work
                        </FormLabel>
                        <div className="text-sm text-gray-600">
                          Did you work overtime hours?
                        </div>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("isOvertime") && (
                  <div className="mt-4 space-y-4 bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-[hsl(var(--text-dark))]">Overtime Details</h4>
                    
                    <FormField
                      control={form.control}
                      name="overtimeHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overtime Hours Worked</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.25"
                              min="0"
                              max="8"
                              placeholder="e.g., 2.5"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="overtimeShiftTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overtime Shift</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select overtime shift..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="extended-day">Extended Day Shift</SelectItem>
                              <SelectItem value="extended-evening">Extended Evening Shift</SelectItem>
                              <SelectItem value="overnight">Overnight Shift</SelectItem>
                              <SelectItem value="weekend">Weekend Shift</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Overtime Machine Slots */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel>Overtime Machine & Operation Details (Max 4 slots)</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOvertimeMachineSlot}
                          disabled={overtimeMachineSlots.length >= 4}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Slot
                        </Button>
                      </div>
                      {overtimeMachineSlots.map((slot, index) => (
                        <Card key={index} className="p-3 bg-white">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Input
                                placeholder="Machine #"
                                value={slot.machineNumber}
                                onChange={(e) => updateOvertimeMachineSlot(index, "machineNumber", e.target.value)}
                              />
                            </div>
                            <div>
                              <Input
                                placeholder="Operation #"
                                value={slot.operationNumber}
                                onChange={(e) => updateOvertimeMachineSlot(index, "operationNumber", e.target.value)}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Hours"
                                value={slot.timeWorked}
                                onChange={(e) => updateOvertimeMachineSlot(index, "timeWorked", parseFloat(e.target.value) || 0)}
                              />
                              {overtimeMachineSlots.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOvertimeMachineSlot(index)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Overtime Time Loss Activities */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Overtime Time Loss Activities</label>
                      <div className="space-y-2">
                        {overtimeTimeLossActivities.map((activity, index) => (
                          <div key={index} className="border rounded-lg p-3 space-y-2 bg-white">
                            <div className="flex items-center space-x-2">
                              <Input
                                placeholder="Overtime activity description"
                                value={activity.activity}
                                onChange={(e) => updateOvertimeTimeLossActivity(index, "activity", e.target.value)}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeOvertimeTimeLossActivity(index)}
                                disabled={overtimeTimeLossActivities.length === 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                placeholder="Duration (minutes)"
                                value={activity.duration}
                                onChange={(e) => updateOvertimeTimeLossActivity(index, "duration", parseInt(e.target.value) || 0)}
                                className="w-32"
                              />
                              <Select
                                value={activity.issueType}
                                onValueChange={(value) => updateOvertimeTimeLossActivity(index, "issueType", value)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Issue type..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {issueTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addOvertimeTimeLossActivity}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Overtime Time Loss Activity
                      </Button>
                    </div>

                    {/* Overtime Defective Part Numbers */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Overtime Defective Part Numbers (if any)</label>
                      <div className="space-y-2">
                        {overtimeDefectivePartNumbers.map((partNumber, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              placeholder="Overtime defective part number"
                              value={partNumber}
                              onChange={(e) => updateOvertimeDefectivePartNumber(index, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOvertimeDefectivePartNumber(index)}
                              disabled={overtimeDefectivePartNumbers.length === 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addOvertimeDefectivePartNumber}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Overtime Defective Part
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Describe work completed, any issues encountered, materials used, etc."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="block text-sm font-medium mb-2">Materials Used</label>
                <div className="space-y-2">
                  {materials.map((material, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Material name"
                        value={material.name}
                        onChange={(e) => updateMaterial(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(index, "quantity", parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                        disabled={materials.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addMaterial}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </div>

              {/* Time Loss Activities */}
              <div>
                <label className="block text-sm font-medium mb-2">Time Loss Activities</label>
                <div className="space-y-2">
                  {timeLossActivities.map((activity, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Activity description"
                          value={activity.activity}
                          onChange={(e) => updateTimeLossActivity(index, "activity", e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTimeLossActivity(index)}
                          disabled={timeLossActivities.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Duration (minutes)"
                          value={activity.duration}
                          onChange={(e) => updateTimeLossActivity(index, "duration", parseInt(e.target.value) || 0)}
                          className="w-32"
                        />
                        <Select
                          value={activity.issueType}
                          onValueChange={(value) => updateTimeLossActivity(index, "issueType", value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Issue type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {issueTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addTimeLossActivity}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Loss Activity
                </Button>
              </div>

              {/* Defective Part Numbers */}
              <div>
                <label className="block text-sm font-medium mb-2">Defective Part Numbers (if any)</label>
                <div className="space-y-2">
                  {defectivePartNumbers.map((partNumber, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Part number (e.g., P-12345, COMP-9876)"
                        value={partNumber}
                        onChange={(e) => updateDefectivePartNumber(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDefectivePartNumber(index)}
                        disabled={defectivePartNumbers.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addDefectivePartNumber}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Defective Part
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Photo Evidence (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm mb-2">Take photos of completed work</p>
                  <p className="text-gray-400 text-xs">Tap to use camera or select from gallery</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Work Card"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
