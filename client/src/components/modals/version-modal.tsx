import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, Plus, Wrench } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { type ProjectVersionWithDetails } from "@shared/schema";
import { z } from "zod";

const formSchema = z.object({
  description: z.string().optional(),
  incrementType: z.enum(["major", "minor", "patch"]),
});

type FormData = z.infer<typeof formSchema>;

interface VersionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

const incrementTypes = [
  {
    type: "major" as const,
    title: "Gros lot",
    description: "Grosses fonctionnalités",
    icon: ArrowUp,
    example: "1.0.0 → 2.0.0",
    color: "border-red-200 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950",
    selectedColor: "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950",
  },
  {
    type: "minor" as const,
    title: "Fonctionnalités",
    description: "Petites fonctionnalités",
    icon: Plus,
    example: "1.0.0 → 1.1.0",
    color: "border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-950",
    selectedColor: "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950",
  },
  {
    type: "patch" as const,
    title: "Corrections",
    description: "Ajout minime, fix, hotfix",
    icon: Wrench,
    example: "1.0.0 → 1.0.1",
    color: "border-green-200 hover:border-green-300 hover:bg-green-50 dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950",
    selectedColor: "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-950",
  },
];

function calculateNextVersion(versions: ProjectVersionWithDetails[], incrementType: "major" | "minor" | "patch"): string {
  if (!versions.length) {
    return "1.0.0";
  }

  // Get the latest version
  const latestVersion = versions
    .map(v => v.version)
    .sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < 3; i++) {
        const diff = (bParts[i] || 0) - (aParts[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    })[0];

  const parts = latestVersion.split('.').map(Number);
  const [major = 0, minor = 0, patch = 0] = parts;

  switch (incrementType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return "1.0.0";
  }
}

export function VersionModal({ open, onOpenChange, projectId }: VersionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIncrement, setSelectedIncrement] = useState<"major" | "minor" | "patch" | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      incrementType: "patch",
    },
  });

  const { data: versions = [] } = useQuery<ProjectVersionWithDetails[]>({
    queryKey: [`/api/projects/${projectId}/versions`],
    enabled: open && !!projectId,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const nextVersion = calculateNextVersion(versions, data.incrementType);
      
      return await apiRequest("POST", `/api/projects/${projectId}/versions`, {
        version: nextVersion,
        description: data.description || null,
        status: "en_developpement",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Succès",
        description: "Version créée avec succès",
      });
      onOpenChange(false);
      form.reset();
      setSelectedIncrement(null);
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
        description: "Impossible de créer la version",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!selectedIncrement) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type d'incrément",
        variant: "destructive",
      });
      return;
    }
    
    mutation.mutate({ ...data, incrementType: selectedIncrement });
  };

  const previewVersion = selectedIncrement ? calculateNextVersion(versions, selectedIncrement) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle version</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Type d'incrément de version</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {incrementTypes.map((increment) => {
                  const Icon = increment.icon;
                  const isSelected = selectedIncrement === increment.type;
                  
                  return (
                    <Card 
                      key={increment.type}
                      className={`cursor-pointer transition-all ${
                        isSelected ? increment.selectedColor : increment.color
                      }`}
                      onClick={() => setSelectedIncrement(increment.type)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <CardTitle className="text-base">{increment.title}</CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                          {increment.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-sm font-mono text-muted-foreground">
                          {increment.example}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {previewVersion && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Prochaine version :</div>
                  <div className="text-lg font-semibold font-mono">{previewVersion}</div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnelle)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez les changements de cette version..."
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending || !selectedIncrement}>
                {mutation.isPending ? "Création..." : "Créer la version"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}