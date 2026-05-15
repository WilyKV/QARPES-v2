import { z } from "zod";

export const TeamCreateSchema = z.object({
  name: z.string({ required_error: "name is required", invalid_type_error: "name must be a string" }).min(1, "name must not be empty").max(200).trim(),
  description: z.string().max(2000).optional().nullable(),
  leaderId: z.string().optional().nullable(),
});

export const TeamUpdateSchema = TeamCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export type TeamCreate = z.infer<typeof TeamCreateSchema>;
export type TeamUpdate = z.infer<typeof TeamUpdateSchema>;
