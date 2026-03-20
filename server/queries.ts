import { eq, and, desc } from "drizzle-orm";
import {
  projects,
  plants,
  measurements,
  quotations,
  type InsertProject,
  type InsertPlant,
  type InsertMeasurement,
  type InsertQuotation,
} from "../drizzle/schema";
import { getDb } from "./db";
import {
  CreateProjectSchema,
  CreatePlantSchema,
  CreateMeasurementSchema,
} from "../shared/schemas";

/**
 * PROJECT QUERIES
 */

export async function getProjectById(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    throw new Error(`Project ${projectId} not found or unauthorized`);
  }

  const project = result[0];

  const projectPlants = await db
    .select()
    .from(plants)
    .where(eq(plants.projectId, projectId));

  const projectMeasurements = await db
    .select()
    .from(measurements)
    .where(eq(measurements.projectId, projectId));

  const projectQuotations = await db
    .select()
    .from(quotations)
    .where(eq(quotations.projectId, projectId));

  return {
    ...project,
    plants: projectPlants,
    measurements: projectMeasurements,
    quotations: projectQuotations,
  };
}

export async function listProjectsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId));
}

export async function createProject(
  userId: number,
  data: {
    name: string;
    description?: string;
    terrain: Record<string, any>;
    status?: "draft" | "active" | "completed" | "archived";
    metadata?: Record<string, any>;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const validated = CreateProjectSchema.parse(data);

  const insertData: InsertProject = {
    userId,
    name: validated.name,
    description: validated.description || null,
    terrain: validated.terrain,
    status: (validated.status || "draft") as any,
    metadata: validated.metadata || null,
  };

  const result = await db.insert(projects).values(insertData).returning();
  return await getProjectById(result[0].id, userId);
}

export async function updateProject(
  projectId: number,
  userId: number,
  data: Partial<{
    name: string;
    description: string;
    terrain: Record<string, any>;
    status: "draft" | "active" | "completed" | "archived";
    metadata: Record<string, any>;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.terrain !== undefined) updateData.terrain = data.terrain;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.metadata !== undefined) updateData.metadata = data.metadata;

  await db
    .update(projects)
    .set(updateData)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return await getProjectById(projectId, userId);
}

export async function deleteProject(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return { success: true, projectId };
}

/**
 * PLANT QUERIES
 */

export async function addPlant(
  projectId: number,
  userId: number,
  data: {
    name: string;
    quantity?: number;
    position: Record<string, any>;
    metadata: Record<string, any>;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const validated = CreatePlantSchema.parse({
    projectId,
    ...data,
  });

  const insertData: InsertPlant = {
    projectId,
    name: validated.name,
    quantity: validated.quantity || 1,
    position: validated.position,
    metadata: validated.metadata,
  };

  const result = await db.insert(plants).values(insertData).returning();
  return result[0];
}

export async function updatePlant(
  plantId: number,
  projectId: number,
  userId: number,
  data: Partial<{
    name: string;
    quantity: number;
    position: Record<string, any>;
    metadata: Record<string, any>;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.metadata !== undefined) updateData.metadata = data.metadata;

  const result = await db
    .update(plants)
    .set(updateData)
    .where(and(eq(plants.id, plantId), eq(plants.projectId, projectId)))
    .returning();

  return result[0];
}

/**
 * MEASUREMENT QUERIES
 */

export async function addMeasurement(
  projectId: number,
  userId: number,
  data: {
    type: "distance" | "area" | "angle" | "height" | "custom";
    value: number;
    unit: string;
    description?: string;
    timestamp?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const validated = CreateMeasurementSchema.parse({
    projectId,
    data,
  });

  const insertData: InsertMeasurement = {
    projectId,
    data: validated.data,
  };

  const result = await db.insert(measurements).values(insertData).returning();
  return result[0];
}

export async function getMeasurements(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(measurements)
    .where(eq(measurements.projectId, projectId));
}

/**
 * QUOTATION QUERIES
 */

export async function addQuotation(
  projectId: number,
  userId: number,
  data: {
    items: any[];
    totalCost: string;
    status?: string;
    metadata?: any;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertData: InsertQuotation = {
    projectId,
    totalCost: data.totalCost,
    items: data.items,
    status: (data.status || "draft") as any,
    metadata: data.metadata || null,
  };

  const result = await db.insert(quotations).values(insertData).returning();
  return result[0];
}

export async function getQuotations(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(quotations)
    .where(eq(quotations.projectId, projectId));
}

export async function updateQuotationStatus(
  quotationId: number,
  projectId: number,
  userId: number,
  status: "draft" | "sent" | "accepted" | "rejected" | "completed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(quotations)
    .set({ status })
    .where(and(eq(quotations.id, quotationId), eq(quotations.projectId, projectId)))
    .returning();

  return result[0];
}
