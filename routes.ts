import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import { analyzeLegalCase, analyzeLegalDocument } from "./services/gemini";
import { scheduledLegalUpdates, updateLegalContent, parsePdfContent } from "./services/legal-data";
import { performAdvancedSearch, generateHighlights } from "./services/advanced-search";
import { legalUpdateScheduler } from "./services/update-scheduler";
import * as fs from 'fs';
import * as path from 'path';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Get all law categories
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getLawCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get a specific law category by ID
  app.get("/api/categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const category = await storage.getLawCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Get all acts
  app.get("/api/acts", async (req: Request, res: Response) => {
    try {
      const acts = await storage.getActs();
      res.json(acts);
    } catch (error) {
      console.error("Error fetching acts:", error);
      res.status(500).json({ message: "Failed to fetch acts" });
    }
  });

  // Get acts by category ID
  app.get("/api/categories/:id/acts", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const acts = await storage.getActsByCategoryId(categoryId);
      res.json(acts);
    } catch (error) {
      console.error("Error fetching acts by category:", error);
      res.status(500).json({ message: "Failed to fetch acts" });
    }
  });

  // Get a specific act by ID
  app.get("/api/acts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid act ID" });
      }

      const act = await storage.getAct(id);
      if (!act) {
        return res.status(404).json({ message: "Act not found" });
      }

      res.json(act);
    } catch (error) {
      console.error("Error fetching act:", error);
      res.status(500).json({ message: "Failed to fetch act" });
    }
  });

  // Get sections by act ID
  app.get("/api/acts/:id/sections", async (req: Request, res: Response) => {
    try {
      const actId = parseInt(req.params.id);
      if (isNaN(actId)) {
        return res.status(400).json({ message: "Invalid act ID" });
      }

      const sections = await storage.getSectionsByActId(actId);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching sections by act:", error);
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  // Get a specific section by ID
  app.get("/api/sections/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid section ID" });
      }

      const section = await storage.getSection(id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }

      res.json(section);
    } catch (error) {
      console.error("Error fetching section:", error);
      res.status(500).json({ message: "Failed to fetch section" });
    }
  });

  // Search sections
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const sections = await storage.searchSections(query);
      res.json(sections);
    } catch (error) {
      console.error("Error searching sections:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });
  
  // Advanced search with NLP
  app.get("/api/advanced-search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const language = (req.query.lang === "hi") ? "hi" as const : "en" as const;
      
      console.log(`Performing advanced search for: "${query}" in ${language}`);
      const results = await performAdvancedSearch(query, language);
      
      // Add highlighted content to results
      const resultsWithHighlights = results.map(result => {
        const contentField = language === 'en' ? 'content' : 'contentHindi';
        const content = result.section[contentField];
        
        return {
          ...result,
          highlightedContent: generateHighlights(content, result.matchedTerms)
        };
      });
      
      res.json(resultsWithHighlights);
    } catch (error) {
      console.error("Error in advanced search:", error);
      res.status(500).json({ 
        message: "Advanced search failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Get all legal updates
  app.get("/api/updates", async (req: Request, res: Response) => {
    try {
      const updates = await storage.getUpdates();
      res.json(updates);
    } catch (error) {
      console.error("Error fetching updates:", error);
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  });

  // Get a specific update by ID
  app.get("/api/updates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid update ID" });
      }

      const update = await storage.getUpdate(id);
      if (!update) {
        return res.status(404).json({ message: "Update not found" });
      }

      res.json(update);
    } catch (error) {
      console.error("Error fetching update:", error);
      res.status(500).json({ message: "Failed to fetch update" });
    }
  });

  // Get user history
  app.get("/api/history/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const history = await storage.getUserHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching user history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Add to user history
  app.post("/api/history", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        userId: z.number(),
        sectionId: z.number(),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request body", errors: result.error });
      }

      const historyEntry = await storage.addToHistory(result.data);
      res.status(201).json(historyEntry);
    } catch (error) {
      console.error("Error adding to history:", error);
      res.status(500).json({ message: "Failed to add to history" });
    }
  });

  // Analyze legal case with Gemini AI
  app.post("/api/analyze-case", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        caseText: z.string().min(10),
        language: z.enum(["en", "hi"]).default("en"),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid request body", errors: result.error });
      }

      const { caseText, language } = result.data;
      const analysis = await analyzeLegalCase(caseText, language);
      
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing case with Gemini:", error);
      res.status(500).json({ message: "Failed to analyze case" });
    }
  });

  // Analyze document with Gemini AI (multimodal)
  app.post("/api/analyze-document", upload.single("document"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No document file uploaded" });
      }

      const language = (req.body.language === "hi") ? "hi" : "en";
      
      const fileBuffer = req.file.buffer;
      const analysis = await analyzeLegalDocument(fileBuffer, language);
      
      res.json({ analysis });
    } catch (error) {
      console.error("Error analyzing document with Gemini:", error);
      res.status(500).json({ message: "Failed to analyze document" });
    }
  });

  // Update legal content and data from external sources
  app.post("/api/admin/update-legal-content", async (req: Request, res: Response) => {
    try {
      // For production, add authentication check here
      const result = await updateLegalContent();
      res.json({ message: "Legal content updated successfully", ...result });
    } catch (error) {
      console.error("Error updating legal content:", error);
      res.status(500).json({ message: "Failed to update legal content" });
    }
  });

  // Parse PDF files and add to database
  app.post("/api/admin/import-pdf-data", async (req: Request, res: Response) => {
    try {
      // For production, add authentication check here
      const pdfDir = path.join(process.cwd(), "attached_assets");
      const pdfFiles = {
        "BNS": { path: path.join(pdfDir, "BNS.pdf"), actId: 1 },
        "BNSS": { path: path.join(pdfDir, "BNSS.pdf"), actId: 2 },
        "BSA": { path: path.join(pdfDir, "BSA.pdf"), actId: 3 }
      };
      
      const results = [];
      
      for (const [name, { path: pdfPath, actId }] of Object.entries(pdfFiles)) {
        if (fs.existsSync(pdfPath)) {
          try {
            console.log(`Processing ${name} from ${pdfPath}`);
            const pdfBuffer = fs.readFileSync(pdfPath);
            const parsedData = await parsePdfContent(pdfBuffer, actId);
            
            if (parsedData && parsedData.length > 0) {
              console.log(`Successfully parsed ${parsedData.length} sections from ${name}`);
              
              // Add sections to storage
              for (const section of parsedData) {
                await storage.createSection(section);
              }
              
              results.push({
                name,
                success: true,
                sectionsCount: parsedData.length
              });
            } else {
              console.log(`No sections parsed from ${name}`);
              results.push({
                name,
                success: false,
                error: "No sections parsed"
              });
            }
          } catch (err) {
            console.error(`Error processing ${name}:`, err);
            results.push({
              name,
              success: false,
              error: err instanceof Error ? err.message : String(err)
            });
          }
        } else {
          console.error(`PDF file not found: ${pdfPath}`);
          results.push({
            name,
            success: false,
            error: "File not found"
          });
        }
      }
      
      res.json({
        message: "PDF import complete",
        results
      });
    } catch (err) {
      console.error("Error importing PDF data:", err);
      res.status(500).json({ 
        message: "Failed to import PDF data", 
        error: err instanceof Error ? err.message : String(err) 
      });
    }
  });
  
  // Case Workbook Routes

  // Get all cases for a user
  app.get("/api/cases/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const cases = await storage.getCases(userId);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  });

  // Get a specific case
  app.get("/api/cases/detail/:id", async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      if (isNaN(caseId)) {
        return res.status(400).json({ error: "Invalid case ID" });
      }
      
      const caseData = await storage.getCase(caseId);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      res.json(caseData);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ error: "Failed to fetch case details" });
    }
  });

  // Create a new case
  app.post("/api/cases", async (req: Request, res: Response) => {
    try {
      const caseSchema = z.object({
        userId: z.number(),
        title: z.string(),
        titleHindi: z.string().optional().nullable(),
        caseNumber: z.string().optional().nullable(),
        court: z.string().optional().nullable(),
        clientName: z.string().optional().nullable(),
        clientPhone: z.string().optional().nullable(),
        clientEmail: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        descriptionHindi: z.string().optional().nullable(),
        status: z.string().optional().default("active"),
        nextHearingDate: z.string().optional().nullable().transform(date => date ? new Date(date) : null),
        nextHearingTime: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        reminderSet: z.boolean().optional().default(false),
        reminderDate: z.string().optional().nullable().transform(date => date ? new Date(date) : null),
        reminderTime: z.string().optional().nullable(),
        reminderNote: z.string().optional().nullable(),
        documents: z.array(z.string()).optional().default([]),
      });
      
      // Log received data for debugging
      console.log("Received case data:", JSON.stringify(req.body));
      
      // Validate and transform the data
      let validatedData = caseSchema.parse(req.body);
      
      console.log("Creating case with data:", JSON.stringify(validatedData));
      const newCase = await storage.createCase(validatedData);
      
      res.status(201).json(newCase);
    } catch (error) {
      console.error("Error creating case:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid case data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create case" });
    }
  });
  
  // Upload document to a case
  app.post("/api/cases/:id/documents", upload.single("document"), async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      if (isNaN(caseId)) {
        return res.status(400).json({ error: "Invalid case ID" });
      }
      
      // Check if file was provided
      if (!req.file) {
        return res.status(400).json({ error: "No document provided" });
      }
      
      // Get the case
      const caseData = await storage.getCase(caseId);
      if (!caseData) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `${timestamp}_${req.file.originalname}`;
      
      // In a real application, you would store this file in a proper storage service
      // For this implementation, we'll just store the file name in the database
      
      // Update the case with the new document
      const documents = caseData.documents || [];
      documents.push(fileName);
      
      // Store file info in the database
      const updatedCase = await storage.updateCase(caseId, {
        documents: documents
      });
      
      // Return the updated case
      res.status(200).json(updatedCase);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Update a case
  app.patch("/api/cases/:id", async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      if (isNaN(caseId)) {
        return res.status(400).json({ error: "Invalid case ID" });
      }
      
      const caseSchema = z.object({
        title: z.string().optional(),
        titleHindi: z.string().optional().nullable(),
        caseNumber: z.string().optional().nullable(),
        court: z.string().optional().nullable(),
        clientName: z.string().optional().nullable(),
        clientPhone: z.string().optional().nullable(),
        clientEmail: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        descriptionHindi: z.string().optional().nullable(),
        status: z.string().optional(),
        nextHearingDate: z.string().optional().nullable().transform(date => date ? new Date(date) : null),
        nextHearingTime: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        reminderSet: z.boolean().optional(),
        reminderDate: z.string().optional().nullable().transform(date => date ? new Date(date) : null),
        reminderTime: z.string().optional().nullable(),
        reminderNote: z.string().optional().nullable(),
        documents: z.array(z.string()).optional(),
      });
      
      const validatedData = caseSchema.parse(req.body);
      const updatedCase = await storage.updateCase(caseId, validatedData);
      
      res.json(updatedCase);
    } catch (error) {
      console.error("Error updating case:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid case data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update case" });
    }
  });

  // Delete a case
  app.delete("/api/cases/:id", async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      if (isNaN(caseId)) {
        return res.status(400).json({ error: "Invalid case ID" });
      }
      
      const success = await storage.deleteCase(caseId);
      if (!success) {
        return res.status(404).json({ error: "Case not found" });
      }
      
      res.json({ success: true, message: "Case deleted successfully" });
    } catch (error) {
      console.error("Error deleting case:", error);
      res.status(500).json({ error: "Failed to delete case" });
    }
  });

  // Case Hearing Routes
  
  // Get all hearings for a case
  app.get("/api/cases/:caseId/hearings", async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.caseId);
      if (isNaN(caseId)) {
        return res.status(400).json({ error: "Invalid case ID" });
      }
      
      const hearings = await storage.getCaseHearings(caseId);
      res.json(hearings);
    } catch (error) {
      console.error("Error fetching hearings:", error);
      res.status(500).json({ error: "Failed to fetch hearings" });
    }
  });

  // Get a specific hearing
  app.get("/api/hearings/:id", async (req: Request, res: Response) => {
    try {
      const hearingId = parseInt(req.params.id);
      if (isNaN(hearingId)) {
        return res.status(400).json({ error: "Invalid hearing ID" });
      }
      
      const hearing = await storage.getCaseHearing(hearingId);
      if (!hearing) {
        return res.status(404).json({ error: "Hearing not found" });
      }
      
      res.json(hearing);
    } catch (error) {
      console.error("Error fetching hearing:", error);
      res.status(500).json({ error: "Failed to fetch hearing details" });
    }
  });

  // Create a new hearing
  app.post("/api/hearings", async (req: Request, res: Response) => {
    try {
      const hearingSchema = z.object({
        caseId: z.number(),
        date: z.string().transform(date => new Date(date)),
        notes: z.string().optional(),
        outcome: z.string().optional(),
        nextSteps: z.string().optional(),
        attendees: z.string().optional(),
        evidencePresented: z.string().optional(),
        judgmentSummary: z.string().optional(),
      });
      
      const validatedData = hearingSchema.parse(req.body);
      const newHearing = await storage.createCaseHearing(validatedData);
      
      res.status(201).json(newHearing);
    } catch (error) {
      console.error("Error creating hearing:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid hearing data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create hearing" });
    }
  });

  // Update a hearing
  app.patch("/api/hearings/:id", async (req: Request, res: Response) => {
    try {
      const hearingId = parseInt(req.params.id);
      if (isNaN(hearingId)) {
        return res.status(400).json({ error: "Invalid hearing ID" });
      }
      
      const hearingSchema = z.object({
        date: z.string().transform(date => new Date(date)).optional(),
        notes: z.string().optional(),
        outcome: z.string().optional(),
        nextSteps: z.string().optional(),
        attendees: z.string().optional(),
        evidencePresented: z.string().optional(),
        judgmentSummary: z.string().optional(),
      });
      
      const validatedData = hearingSchema.parse(req.body);
      const updatedHearing = await storage.updateCaseHearing(hearingId, validatedData);
      
      res.json(updatedHearing);
    } catch (error) {
      console.error("Error updating hearing:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid hearing data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update hearing" });
    }
  });

  // Delete a hearing
  app.delete("/api/hearings/:id", async (req: Request, res: Response) => {
    try {
      const hearingId = parseInt(req.params.id);
      if (isNaN(hearingId)) {
        return res.status(400).json({ error: "Invalid hearing ID" });
      }
      
      const success = await storage.deleteCaseHearing(hearingId);
      if (!success) {
        return res.status(404).json({ error: "Hearing not found" });
      }
      
      res.json({ success: true, message: "Hearing deleted successfully" });
    } catch (error) {
      console.error("Error deleting hearing:", error);
      res.status(500).json({ error: "Failed to delete hearing" });
    }
  });
  
  // Schedule updates to run when server starts
  setTimeout(async () => {
    try {
      console.log("Running scheduled legal updates...");
      await scheduledLegalUpdates();
    } catch (error) {
      console.error("Error in scheduled legal updates:", error);
    }
  }, 10000); // Run 10 seconds after server starts
  
  const httpServer = createServer(app);
  return httpServer;
}
