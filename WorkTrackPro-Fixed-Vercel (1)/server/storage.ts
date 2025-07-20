import { 
  employees, 
  workCards, 
  workSessions, 
  reports,
  type Employee, 
  type InsertEmployee,
  type WorkCard, 
  type InsertWorkCard,
  type WorkSession,
  type InsertWorkSession,
  type Report,
  type InsertReport,
} from "@shared/schema";

export interface IStorage {
  // Employee operations
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Work card operations
  getWorkCard(id: number): Promise<WorkCard | undefined>;
  getWorkCardByCardId(cardId: string): Promise<WorkCard | undefined>;
  getWorkCardByQrCode(qrCode: string): Promise<WorkCard | undefined>;
  getAllWorkCards(): Promise<WorkCard[]>;
  getWorkCardsByEmployee(employeeId: number): Promise<WorkCard[]>;
  getWorkCardsByStatus(status: string): Promise<WorkCard[]>;
  createWorkCard(workCard: InsertWorkCard): Promise<WorkCard>;
  updateWorkCard(id: number, updates: Partial<WorkCard>): Promise<WorkCard | undefined>;
  deleteWorkCard(id: number): Promise<boolean>;

  // Work session operations
  getWorkSession(id: number): Promise<WorkSession | undefined>;
  getWorkSessionsByCard(workCardId: number): Promise<WorkSession[]>;
  getWorkSessionsByEmployee(employeeId: number): Promise<WorkSession[]>;
  getRecentWorkSessions(limit: number): Promise<WorkSession[]>;
  createWorkSession(session: InsertWorkSession): Promise<WorkSession>;

  // Report operations
  getReport(id: number): Promise<Report | undefined>;
  getAllReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined>;
  deleteReport(id: number): Promise<boolean>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    activeWorkers: number;
    completedToday: number;
    inProgress: number;
    overdue: number;
  }>;
}

export class MemStorage implements IStorage {
  private employees: Map<number, Employee>;
  private workCards: Map<number, WorkCard>;
  private workSessions: Map<number, WorkSession>;
  private reports: Map<number, Report>;
  private currentId: number;

  constructor() {
    this.employees = new Map();
    this.workCards = new Map();
    this.workSessions = new Map();
    this.reports = new Map();
    this.currentId = 1;
    this.seedData();
  }

  private seedData() {
    // Create some initial employees
    const employee1: Employee = {
      id: this.currentId++,
      name: "Mike Rodriguez",
      employeeId: "EMP-001",
      department: "Construction",
      location: "Site Block A",
      status: "active",
      lastSeen: new Date(Date.now() - 2 * 60000), // 2 minutes ago
      createdAt: new Date(),
    };
    this.employees.set(employee1.id, employee1);

    const employee2: Employee = {
      id: this.currentId++,
      name: "Sarah Chen",
      employeeId: "EMP-002", 
      department: "Electrical",
      location: "Building B - Floor 2",
      status: "active",
      lastSeen: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      createdAt: new Date(),
    };
    this.employees.set(employee2.id, employee2);

    const employee3: Employee = {
      id: this.currentId++,
      name: "James Wilson",
      employeeId: "EMP-003",
      department: "Plumbing",
      location: "Building C - All Floors",
      status: "active",
      lastSeen: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      createdAt: new Date(),
    };
    this.employees.set(employee3.id, employee3);

    // Create some work cards
    const workCard1: WorkCard = {
      id: this.currentId++,
      cardId: "WC-001",
      title: "Foundation Pour - Section A",
      description: "Complete concrete foundation pour for building section A with proper curing procedures",
      assignedToId: employee1.id,
      location: "Site Block A",
      status: "completed",
      priority: "high",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      startedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      completedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      progressPercent: 100,
      hoursWorked: 480, // 8 hours in minutes
      notes: "Foundation pour completed successfully. Concrete properly mixed and cured.",
      materials: [
        { name: "Concrete", quantity: 50 },
        { name: "Rebar", quantity: 100 }
      ],
      photoUrls: [],
      qrCode: "QR-WC-001-ABCD1234",
      // Manufacturing-specific fields
      shiftTime: "day",
      machineNumber: "PUMP-01",
      operationNumber: "POUR-001",
      timeLossActivities: [
        { activity: "Equipment setup", duration: 15, issueType: "setup" },
        { activity: "Material delivery delay", duration: 30, issueType: "material-shortage" }
      ],
      defectivePartNumbers: [],
      totalWorkHours: 480, // 8 hours in minutes
      // Overtime fields
      isOvertime: false,
      overtimeHours: 0,
      overtimeShiftTime: null,
      overtimeMachineNumber: null,
      overtimeOperationNumber: null,
      overtimeTimeLossActivities: [],
      overtimeDefectivePartNumbers: [],
      createdAt: new Date(),
    };
    this.workCards.set(workCard1.id, workCard1);

    const workCard2: WorkCard = {
      id: this.currentId++,
      cardId: "WC-002", 
      title: "Electrical Installation - Floor 2",
      description: "Install electrical wiring and outlets for second floor residential units",
      assignedToId: employee2.id,
      location: "Building B - Floor 2",
      status: "in-progress",
      priority: "normal",
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // In 2 days
      startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      completedAt: null,
      progressPercent: 67,
      hoursWorked: 360, // 6 hours in minutes
      notes: "Wiring installation in progress. 2 of 3 units completed.",
      materials: [
        { name: "Electrical Wire", quantity: 500 },
        { name: "Outlets", quantity: 24 }
      ],
      photoUrls: [],
      qrCode: "QR-WC-002-EFGH5678",
      // Manufacturing-specific fields
      shiftTime: "evening",
      machineNumber: "DRILL-05",
      operationNumber: "WIRE-002",
      timeLossActivities: [
        { activity: "Circuit breaker issue", duration: 45, issueType: "maintenance" }
      ],
      defectivePartNumbers: ["OUTLET-4521"],
      totalWorkHours: 360, // 6 hours in minutes
      // Overtime fields - example with overtime
      isOvertime: true,
      overtimeHours: 120, // 2 hours overtime in minutes
      overtimeShiftTime: "extended-evening",
      overtimeMachineNumber: "DRILL-05",
      overtimeOperationNumber: "WIRE-OT-002",
      overtimeTimeLossActivities: [
        { activity: "Overtime setup delay", duration: 20, issueType: "setup" }
      ],
      overtimeDefectivePartNumbers: [],
      createdAt: new Date(),
    };
    this.workCards.set(workCard2.id, workCard2);

    const workCard3: WorkCard = {
      id: this.currentId++,
      cardId: "WC-003",
      title: "Plumbing Rough-in - Building C",
      description: "Install rough plumbing lines for bathroom and kitchen areas",
      assignedToId: employee3.id,
      location: "Building C - All Floors",
      status: "assigned",
      priority: "normal",
      deadline: new Date(Date.now() + 36 * 60 * 60 * 1000), // In 1.5 days
      startedAt: null,
      completedAt: null,
      progressPercent: 0,
      hoursWorked: 0,
      notes: null,
      materials: [],
      photoUrls: [],
      qrCode: "QR-WC-003-IJKL9012",
      // Manufacturing-specific fields
      shiftTime: null,
      machineNumber: null,
      operationNumber: null,
      timeLossActivities: [],
      defectivePartNumbers: [],
      totalWorkHours: 0,
      // Overtime fields
      isOvertime: false,
      overtimeHours: 0,
      overtimeShiftTime: null,
      overtimeMachineNumber: null,
      overtimeOperationNumber: null,
      overtimeTimeLossActivities: [],
      overtimeDefectivePartNumbers: [],
      createdAt: new Date(),
    };
    this.workCards.set(workCard3.id, workCard3);
  }

  // Employee operations
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(emp => emp.employeeId === employeeId);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.currentId++;
    const employee: Employee = {
      ...insertEmployee,
      id,
      status: insertEmployee.status || "active",
      location: insertEmployee.location || null,
      lastSeen: new Date(),
      createdAt: new Date(),
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updatedEmployee = { ...employee, ...updates };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Work card operations
  async getWorkCard(id: number): Promise<WorkCard | undefined> {
    return this.workCards.get(id);
  }

  async getWorkCardByCardId(cardId: string): Promise<WorkCard | undefined> {
    return Array.from(this.workCards.values()).find(card => card.cardId === cardId);
  }

  async getWorkCardByQrCode(qrCode: string): Promise<WorkCard | undefined> {
    return Array.from(this.workCards.values()).find(card => card.qrCode === qrCode);
  }

  async getAllWorkCards(): Promise<WorkCard[]> {
    return Array.from(this.workCards.values());
  }

  async getWorkCardsByEmployee(employeeId: number): Promise<WorkCard[]> {
    return Array.from(this.workCards.values()).filter(card => card.assignedToId === employeeId);
  }

  async getWorkCardsByStatus(status: string): Promise<WorkCard[]> {
    return Array.from(this.workCards.values()).filter(card => card.status === status);
  }

  async createWorkCard(insertWorkCard: InsertWorkCard): Promise<WorkCard> {
    const id = this.currentId++;
    const qrCode = `QR-${insertWorkCard.cardId}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    const workCard: WorkCard = {
      ...insertWorkCard,
      id,
      status: insertWorkCard.status || "assigned",
      assignedToId: insertWorkCard.assignedToId || null,
      priority: insertWorkCard.priority || "normal",
      deadline: insertWorkCard.deadline || null,
      startedAt: insertWorkCard.startedAt || null,
      completedAt: insertWorkCard.completedAt || null,
      progressPercent: insertWorkCard.progressPercent || 0,
      hoursWorked: insertWorkCard.hoursWorked || 0,
      notes: insertWorkCard.notes || null,
      materials: insertWorkCard.materials || null,
      photoUrls: insertWorkCard.photoUrls || null,
      // Manufacturing-specific fields
      shiftTime: insertWorkCard.shiftTime || null,
      machineNumber: insertWorkCard.machineNumber || null,
      operationNumber: insertWorkCard.operationNumber || null,
      timeLossActivities: insertWorkCard.timeLossActivities || [],
      defectivePartNumbers: insertWorkCard.defectivePartNumbers || [],
      totalWorkHours: insertWorkCard.totalWorkHours || 0,
      // Overtime fields
      isOvertime: insertWorkCard.isOvertime || false,
      overtimeHours: insertWorkCard.overtimeHours || 0,
      overtimeShiftTime: insertWorkCard.overtimeShiftTime || null,
      overtimeMachineNumber: insertWorkCard.overtimeMachineNumber || null,
      overtimeOperationNumber: insertWorkCard.overtimeOperationNumber || null,
      overtimeTimeLossActivities: insertWorkCard.overtimeTimeLossActivities || [],
      overtimeDefectivePartNumbers: insertWorkCard.overtimeDefectivePartNumbers || [],
      qrCode,
      createdAt: new Date(),
    };
    this.workCards.set(id, workCard);
    return workCard;
  }

  async updateWorkCard(id: number, updates: Partial<WorkCard>): Promise<WorkCard | undefined> {
    const workCard = this.workCards.get(id);
    if (!workCard) return undefined;
    
    const updatedCard = { ...workCard, ...updates };
    this.workCards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteWorkCard(id: number): Promise<boolean> {
    return this.workCards.delete(id);
  }

  // Work session operations
  async getWorkSession(id: number): Promise<WorkSession | undefined> {
    return this.workSessions.get(id);
  }

  async getWorkSessionsByCard(workCardId: number): Promise<WorkSession[]> {
    return Array.from(this.workSessions.values()).filter(session => session.workCardId === workCardId);
  }

  async getWorkSessionsByEmployee(employeeId: number): Promise<WorkSession[]> {
    return Array.from(this.workSessions.values()).filter(session => session.employeeId === employeeId);
  }

  async getRecentWorkSessions(limit: number): Promise<WorkSession[]> {
    return Array.from(this.workSessions.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createWorkSession(insertSession: InsertWorkSession): Promise<WorkSession> {
    const id = this.currentId++;
    const session: WorkSession = {
      workCardId: insertSession.workCardId || null,
      employeeId: insertSession.employeeId || null,
      action: insertSession.action,
      previousStatus: insertSession.previousStatus || null,
      newStatus: insertSession.newStatus || null,
      progressUpdate: insertSession.progressUpdate || null,
      hoursWorked: insertSession.hoursWorked || null,
      notes: insertSession.notes || null,
      materials: insertSession.materials || null,
      photoUrls: insertSession.photoUrls || null,
      id,
      timestamp: new Date(),
    };
    this.workSessions.set(id, session);
    return session;
  }

  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentId++;
    const report: Report = {
      ...insertReport,
      id,
      status: "generating",
      filters: insertReport.filters || null,
      filePath: null,
      generatedAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, ...updates };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteReport(id: number): Promise<boolean> {
    return this.reports.delete(id);
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeWorkers: number;
    completedToday: number;
    inProgress: number;
    overdue: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeWorkers = Array.from(this.employees.values())
      .filter(emp => emp.status === "active").length;
    
    const completedToday = Array.from(this.workCards.values())
      .filter(card => 
        card.status === "completed" && 
        card.completedAt && 
        card.completedAt >= today
      ).length;
    
    const inProgress = Array.from(this.workCards.values())
      .filter(card => card.status === "in-progress").length;
    
    const now = new Date();
    const overdue = Array.from(this.workCards.values())
      .filter(card => 
        card.deadline && 
        card.deadline < now && 
        card.status !== "completed"
      ).length;

    return {
      activeWorkers,
      completedToday,
      inProgress,
      overdue,
    };
  }
}

export const storage = new MemStorage();
