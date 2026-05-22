import { z } from "zod";

// === Site Settings ===
export const SiteSettingsSchema = z.object({
  logDashboardUrl: z.string().url().optional().or(z.literal("")),
  kitCitizenUrl: z.string().url().optional().or(z.literal("")),
});

export type SiteSettingsInput = z.infer<typeof SiteSettingsSchema>;

// === Notifications ===
export const CreateNotificationSchema = z.object({
  message: z.string().min(1, "Le message est requis").max(500, "Le message ne doit pas dépasser 500 caractères"),
  color: z.enum(["blue", "red", "yellow", "green", "orange", "purple"]).default("blue"),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

// === Security Announcements ===
export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200, "Le titre ne doit pas dépasser 200 caractères"),
  content: z.string().min(1, "Le contenu est requis").max(5000, "Le contenu ne doit pas dépasser 5000 caractères"),
  isFeatured: z.boolean().default(false),
});

export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial();

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementSchema>;
