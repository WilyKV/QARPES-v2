import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { z } from "zod";
import { STATUS_OPTIONS } from "@/lib/constants";
import type { ReleaseWithProjects } from "@shared/schema";

const formSchema = z.object({
  name: z.string().optional(),
  status: z.enum(["0", "1", "2", "3", "4", "5", "Annulé"]),
  recetteDate: z.string().min(1, "La date de recette est requise"),
  preprodDate: z.string().min(1, "La date de préprod est requise"),
  productionDate: z.string().min(1, "La date de production est requise"),
});

type FormData = z.infer<typeof formSchema>;

interface ReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  release?: ReleaseWithProjects | null;
}

export function ReleaseModal({ open, onOpenChange, release }: ReleaseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!release;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: "0",
      recetteDate: "",
      preprodDate: "",
      productionDate: "",
    },
  });

  // Fonction utilitaire pour convertir une date en format YYYY-MM-DD
  const formatDateForInput = (date: any) => {
    if (!date) return "";
    if (typeof date === "string") {
      // Si c'est déjà une string, on prend seulement la partie date (sans l'heure)
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    // Si c'est un objet avec une méthode toISOString
    if (typeof date === "object" && typeof date.toISOString === "function") {
      return date.toISOString().split('T')[0];
    }
    return "";
  };

  useEffect(() => {
    if (release) {
      form.reset({
        name: String(release.name || ""),
        status: String(release.status || "0") as FormData["status"],
        recetteDate: formatDateForInput(release.recetteDate),
        preprodDate: formatDateForInput(release.preprodDate),
        productionDate: formatDateForInput(release.productionDate),
      });
    } else {
      form.reset({
        name: "",
        status: "0",
        recetteDate: "",
        preprodDate: "",
        productionDate: "",
      });
    }
  }, [release, form]);

  // Fonction pour générer le releaseId basé sur la date de production
  const generateReleaseId = async (productionDate: string): Promise<string> => {
    if (!productionDate) {
      throw new Error("La date de production est requise pour générer l'ID de release");
    }
    
    const date = new Date(productionDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // Récupérer les releases existantes pour ce mois
    const response = await apiRequest("GET", `/api/releases?yearMonth=${yearMonth}`);
    const existingReleases = Array.isArray(response) ? response : [];
    
    // Trouver le plus grand numéro de séquence pour ce mois
    let maxSequence = 0;
    existingReleases.forEach((rel: any) => {
      const releaseId = String(rel.releaseId || '');
      if (releaseId.startsWith(yearMonth + '-')) {
        const sequence = parseInt(releaseId.split('-')[1] || '0', 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    });
    
    // Générer le nouveau numéro de séquence
    const newSequence = String(maxSequence + 1).padStart(2, '0');
    return `${yearMonth}-${newSequence}`;
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const basePayload = {
        ...data,
        recetteDate: data.recetteDate || null,
        preprodDate: data.preprodDate || null,
        productionDate: data.productionDate || null,
      };
      // releaseId is generated server-side or injected here as extra field
      const payload: Record<string, unknown> = { ...basePayload };

      // Si c'est une nouvelle release, générer automatiquement le releaseId
      if (!isEditing && data.productionDate) {
        const generatedReleaseId = await generateReleaseId(data.productionDate);
        payload["releaseId"] = generatedReleaseId;
      }

      if (isEditing) {
        await apiRequest("PUT", `/api/releases/${release.id}`, payload);
      } else {
        await apiRequest("POST", "/api/releases", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Succès",
        description: `Release ${isEditing ? "modifiée" : "créée"} avec succès${!isEditing ? " - Version automatiquement générée" : ""}`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: `Impossible de ${isEditing ? "modifier" : "créer"} la release`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la release" : "Créer une nouvelle release"}
          </DialogTitle>
          {!isEditing && (
            <p className="text-sm text-muted-foreground">
              La version sera automatiquement générée au format YYYYMM-NN basée sur la date de production
            </p>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Ligne nom + statut */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de la release" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full md:w-60">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.release.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Ligne des 3 dates */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="recetteDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de mise en recette</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="preprodDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de mise en préprod</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="productionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de mise en production</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending 
                  ? (isEditing ? "Modification..." : "Création...") 
                  : (isEditing ? "Modifier" : "Créer")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}