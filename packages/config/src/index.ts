import { z } from "zod";

// =============================================================================
// Common Validators
// =============================================================================

export const IdSchema = z.number().int().positive();
export const UuidSchema = z.string().uuid();
export const NameSchema = z.string().trim().min(1).max(255);
export const EmailSchema = z.string().email();
export const DateSchema = z.date().nullish();

// =============================================================================
// Flow Schemas
// =============================================================================

export const FlowStatusSchema = z.enum(["inProgress", "finished"]);

export const CreateFlowSchema = z.object({
  modelProvider: z.string().trim().min(1),
  modelId: z.string().trim().min(1),
});

// =============================================================================
// Task Schemas
// =============================================================================

export const TaskStatusSchema = z.enum([
  "inProgress",
  "finished",
  "failed",
  "stopped",
]);

export const TaskTypeSchema = z.enum([
  "ask",
  "browser",
  "code",
  "done",
  "input",
  "terminal",
]);

export const CreateTaskSchema = z.object({
  flowId: IdSchema,
  query: z.string().trim().min(1),
});

// =============================================================================
// Re-export Zod
// =============================================================================

export type { ZodError, ZodIssue } from "zod";
export { z };

