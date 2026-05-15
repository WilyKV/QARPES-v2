import { z } from "zod";

export const ReleaseStatusEnum = z.enum(["planifiee", "en_cours", "deployee", "annulee"]);

export const ReleaseCreateSchema = z.object({
  name: z.string({ required_error: "name is required", invalid_type_error: "name must be a string" }).min(1, "name must not be empty").max(200).trim(),
  status: ReleaseStatusEnum.optional(),
  releaseId: z.string().optional().nullable(),
  recetteDate: z.string().optional().nullable(),
  preprodDate: z.string().optional().nullable(),
  productionDate: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

export const ReleaseUpdateSchema = ReleaseCreateSchema.partial();

export type ReleaseCreate = z.infer<typeof ReleaseCreateSchema>;
export type ReleaseUpdate = z.infer<typeof ReleaseUpdateSchema>;
