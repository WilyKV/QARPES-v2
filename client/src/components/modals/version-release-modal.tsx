import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Link as LinkIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertReleaseSchema, type ReleaseWithProjects } from "@shared/schema";
import { z } from "zod";

const releaseFormSchema = insertReleaseSchema.extend({
  recetteDate: z.string().optional(),
  preprodDate: z.string().optional(), 
  productionDate: z.string().optional(),
});

const associationSchema = z.object({
  releaseId: z.number().optional(),
  createRelease: releaseFormSchema.optional(),
});

type FormData = z.infer<typeof associationSchema>;

interface VersionReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  versionId: number;
  versionName: string;
}

const statusColors = {
  testing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  preproduction: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

const statusLabels = {
  testing: "Recette",
  preproduction: "Préprod",
  production: "Production",
};

export function VersionReleaseModal({ 
  open, 
  onOpenChange, 
  projectId, 
  versionId, 
  versionName 
}: VersionReleaseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("existing");

  const form = useForm<FormData>({
    resolver: zodResolver(associationSchema),
    defaultValues: {
      releaseId: undefined,
      createRelease: {
        name: "",
        description: "",
        status: "testing",
        recetteDate: "",
        preprodDate: "",
        productionDate: "",
      },
    },
  });

  const { data: releases = [] } = useQuery({
    queryKey: ["/api/releases"],
    enabled: open,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: any = {};
      
      if (activeTab === "existing" && data.releaseId) {
        payload.releaseId = data.releaseId;
      } else if (activeTab === "new" && data.createRelease) {
        payload.createRelease = {
          ...data.createRelease,
          recetteDate: data.createRelease.recetteDate || null,
          preprodDate: data.createRelease.preprodDate || null,
          productionDate: data.createRelease.productionDate || null,
        };
      }

      return await apiRequest("POST", `/api/projects/${projectId}/versions/${versionId}/release`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions`] });
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({
        title: "Succès",
        description: `Version ${versionName} associée à la release avec succès`,
      });
      onOpenChange(false);
      form.reset();
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
        description: "Impossible d'associer la version à la release",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (activeTab === "existing" && !data.releaseId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une release existante",
        variant: "destructive",
      });
      return;
    }
    
    if (activeTab === "new" && (!data.createRelease?.name || !data.createRelease?.productionDate)) {
      toast({
        title: "Erreur", 
        description: "Veuillez remplir au minimum le nom et la date de production",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Associer la version {versionName} à une release
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Release existante
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle release
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="existing" className="space-y-4">
                <FormField
                  control={form.control}
                  name="releaseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sélectionner une release</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisissez une release existante" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {releases.map((release: any) => (
                            <SelectItem key={release.id} value={release.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{release.releaseId}</span>
                                  <span>-</span>
                                  <span>{release.name}</span>
                                </div>
                                <Badge className={statusColors[release.status as keyof typeof statusColors] || statusColors.testing}>
                                  {statusLabels[release.status as keyof typeof statusLabels] || release.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                <FormField
                  control={form.control}
                  name="createRelease.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la release</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de la nouvelle release" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="createRelease.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Description de la release..." 
                          rows={3} 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="createRelease.status"
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
                          <SelectItem value="testing">Tests</SelectItem>
                          <SelectItem value="preproduction">Préprod</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="createRelease.recetteDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de recette</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="createRelease.preprodDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de préprod</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="createRelease.productionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de production *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  La version sera automatiquement générée au format YYYYMM-NN
                </p>
              </TabsContent>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending 
                    ? "Association..." 
                    : (activeTab === "existing" ? "Associer" : "Créer et associer")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}