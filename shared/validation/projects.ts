import { z } from "zod";

export const ProjectCreateSchema = z.object({
  name: z.string({ required_error: "name is required", invalid_type_error: "name must be a string" }).min(1, "name must not be empty").max(200).trim(),
  description: z.string().max(2000).optional().nullable(),
  teamId: z.number({ invalid_type_error: "teamId must be a number" }).int().positive().optional().nullable(),
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial();

export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>;
