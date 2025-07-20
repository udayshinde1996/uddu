import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import QRCode from "qrcode";
import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import {
  insertEmployeeSchema,
  insertWorkCardSchema,
  insertWorkSessionSchema,
  insertReportSchema,
  workCompletionSchema,
  type Employee,
  type WorkCard,
  type WorkSession,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const data = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(data);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const employee = await storage.updateEmployee(id, updates);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Work card routes
  app.get("/api/work-cards", async (req, res) => {
    try {
      const { status, employeeId } = req.query;
      
      let workCards;
      if (status) {
        workCards = await storage.getWorkCardsByStatus(status as string);
      } else if (employeeId) {
        workCards = await storage.getWorkCardsByEmployee(parseInt(employeeId as string));
      } else {
        workCards = await storage.getAllWorkCards();
      }

      // Populate employee data
      const workCardsWithEmployees = await Promise.all(
        workCards.map(async (card) => {
          const employee = card.assignedToId 
            ? await storage.getEmployee(card.assignedToId)
            : null;
          return {
            ...card,
            assignedTo: employee ? {
              id: employee.id,
              name: employee.name,
              employeeId: employee.employeeId,
            } : null,
          };
        })
      );

      res.json(workCardsWithEmployees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work cards" });
    }
  });

  app.get("/api/work-cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workCard = await storage.getWorkCard(id);
      if (!workCard) {
        return res.status(404).json({ message: "Work card not found" });
      }

      const employee = workCard.assignedToId 
        ? await storage.getEmployee(workCard.assignedToId)
        : null;

      res.json({
        ...workCard,
        assignedTo: employee ? {
          id: employee.id,
          name: employee.name,
          employeeId: employee.employeeId,
        } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work card" });
    }
  });

  app.get("/api/work-cards/qr/:qrCode", async (req, res) => {
    try {
      const qrCode = req.params.qrCode;
      const workCard = await storage.getWorkCardByQrCode(qrCode);
      if (!workCard) {
        return res.status(404).json({ message: "Work card not found" });
      }

      const employee = workCard.assignedToId 
        ? await storage.getEmployee(workCard.assignedToId)
        : null;

      res.json({
        ...workCard,
        assignedTo: employee ? {
          id: employee.id,
          name: employee.name,
          employeeId: employee.employeeId,
        } : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work card" });
    }
  });

  app.post("/api/work-cards", async (req, res) => {
    try {
      const data = insertWorkCardSchema.parse(req.body);
      const workCard = await storage.createWorkCard(data);
      res.status(201).json(workCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid work card data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create work card" });
    }
  });

  app.get("/api/work-cards/:id/qr", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workCard = await storage.getWorkCard(id);
      if (!workCard) {
        return res.status(404).json({ message: "Work card not found" });
      }

      const qrCodeDataUrl = await QRCode.toDataURL(workCard.qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({ qrCode: qrCodeDataUrl, qrData: workCard.qrCode });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Work completion route
  app.post("/api/work-cards/:id/complete", async (req, res) => {
    try {
      const workCardId = parseInt(req.params.id);
      const data = workCompletionSchema.parse({ ...req.body, workCardId });

      const workCard = await storage.getWorkCard(workCardId);
      if (!workCard) {
        return res.status(404).json({ message: "Work card not found" });
      }

      // Create work session record
      const session: any = {
        workCardId: workCardId,
        employeeId: workCard.assignedToId,
        action: data.status,
        previousStatus: workCard.status,
        newStatus: data.status,
        progressUpdate: data.progressPercent,
        hoursWorked: data.hoursWorked * 60, // Convert to minutes
        notes: data.notes,
        materials: data.materials || [],
        photoUrls: data.photoUrls || [],
      };

      await storage.createWorkSession(session);

      // Update work card
      const updates: Partial<WorkCard> = {
        status: data.status,
        progressPercent: data.progressPercent,
        hoursWorked: (workCard.hoursWorked || 0) + (data.hoursWorked * 60),
        notes: data.notes,
        materials: data.materials || [],
        photoUrls: data.photoUrls || [],
      };

      if (data.status === "started" && !workCard.startedAt) {
        updates.startedAt = new Date();
      }

      if (data.status === "completed") {
        updates.completedAt = new Date();
        updates.progressPercent = 100;
      }

      const updatedCard = await storage.updateWorkCard(workCardId, updates);

      res.json(updatedCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid completion data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to complete work card" });
    }
  });

  // Work sessions routes
  app.get("/api/work-sessions/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const sessions = await storage.getRecentWorkSessions(limit);
      
      // Populate with work card and employee data
      const sessionsWithData = await Promise.all(
        sessions.map(async (session) => {
          const workCard = session.workCardId 
            ? await storage.getWorkCard(session.workCardId)
            : null;
          const employee = session.employeeId 
            ? await storage.getEmployee(session.employeeId)
            : null;
          
          return {
            ...session,
            workCard: workCard ? {
              id: workCard.id,
              cardId: workCard.cardId,
              title: workCard.title,
            } : null,
            employee: employee ? {
              id: employee.id,
              name: employee.name,
              employeeId: employee.employeeId,
            } : null,
          };
        })
      );

      res.json(sessionsWithData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work sessions" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Reports routes
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const data = insertReportSchema.parse(req.body);
      const report = await storage.createReport(data);

      // Start report generation in background
      generateExcelReport(report);

      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  app.get("/api/reports/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      if (report.status !== "ready" || !report.filePath) {
        return res.status(400).json({ message: "Report not ready for download" });
      }

      const filePath = path.join(process.cwd(), report.filePath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Report file not found" });
      }

      res.download(filePath, `${report.name}.xlsx`);
    } catch (error) {
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // Background report generation
  async function generateExcelReport(report: any) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Work Summary');

      if (report.type === "daily-summary") {
        // Get work cards for the date range
        const workCards = await storage.getAllWorkCards();
        const filteredCards = workCards.filter(card => {
          const cardDate = card.createdAt;
          return cardDate && cardDate >= report.dateFrom && cardDate <= report.dateTo;
        });

        // Set up headers
        worksheet.columns = [
          { header: 'Card ID', key: 'cardId', width: 15 },
          { header: 'Title', key: 'title', width: 30 },
          { header: 'Employee', key: 'employee', width: 20 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Progress %', key: 'progress', width: 12 },
          { header: 'Hours Worked', key: 'hours', width: 15 },
          { header: 'Location', key: 'location', width: 20 },
          { header: 'Notes', key: 'notes', width: 40 },
        ];

        // Add data
        for (const card of filteredCards) {
          const employee = card.assignedToId ? await storage.getEmployee(card.assignedToId) : null;
          worksheet.addRow({
            cardId: card.cardId,
            title: card.title,
            employee: employee?.name || 'Unassigned',
            status: card.status,
            progress: card.progressPercent,
            hours: Math.round((card.hoursWorked || 0) / 60 * 10) / 10, // Convert minutes to hours
            location: card.location,
            notes: card.notes || '',
          });
        }

        // Style the header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '2563EB' },
        };
      }

      // Save file
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const fileName = `report_${report.id}_${Date.now()}.xlsx`;
      const filePath = path.join(reportsDir, fileName);
      await workbook.xlsx.writeFile(filePath);

      // Update report status
      await storage.updateReport(report.id, {
        status: "ready",
        filePath: `reports/${fileName}`,
      });
    } catch (error) {
      console.error("Failed to generate report:", error);
      await storage.updateReport(report.id, {
        status: "failed",
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
