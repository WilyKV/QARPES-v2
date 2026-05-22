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
import { z } from "zod";
import { type ReleaseWithProjects } from "@shared/schema";
import { STATUS_OPTIONS } from "@/lib/constants";

const existingReleaseSchema = z.object({
 releaseId: z.string().min(1, "Veuillez sélectionner une release"),
});

const newReleaseSchema = z.object({
 name: z.string().optional(),
 status: z.enum(["0", "1", "2", "3", "4", "5", "Annulé"]),
 recetteDate: z.string().optional(),
 preprodDate: z.string().optional(), 
 productionDate: z.string().min(1, "La date de production est requise"),
});

type ExistingReleaseFormData = z.infer<typeof existingReleaseSchema>;
type NewReleaseFormData = z.infer<typeof newReleaseSchema>;

interface VersionReleaseModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 projectId: number;
 versionId: number;
 versionName: string;
 currentReleaseId?: number | null;
}

const statusColors = {
 testing: "bg-yellow-100 text-yellow-800",
 preproduction: "bg-blue-100 text-blue-800",
 production: "bg-green-100 text-green-800",
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
 versionName,
 currentReleaseId
}: VersionReleaseModalProps) {
 const { toast } = useToast();
 const queryClient = useQueryClient();
 const [activeTab, setActiveTab] = useState("existing");

 // Formulaire pour release existante
 const existingForm = useForm<ExistingReleaseFormData>({
 resolver: zodResolver(existingReleaseSchema),
 defaultValues: {
 releaseId: currentReleaseId ? currentReleaseId.toString() : "",
 },
 });

 // Formulaire pour nouvelle release
 const newForm = useForm<NewReleaseFormData>({
 resolver: zodResolver(newReleaseSchema),
 defaultValues: {
 name: "",
 status: "0",
 recetteDate: "",
 preprodDate: "",
 productionDate: "",
 },
 });

 const { data: releases = [] } = useQuery<any[]>({
 queryKey: ["/api/releases"],
 enabled: open,
 retry: false,
 });

 console.log("📋 Available releases:", releases);

 // Remettre à jour le formulaire quand le modal s'ouvre
 useEffect(() => {
 if (open) {
 existingForm.setValue("releaseId", currentReleaseId ? currentReleaseId.toString() : "");
 }
 }, [open, currentReleaseId, existingForm]);

 const mutation = useMutation({
 mutationFn: async (payload: any) => {
 console.log("🚀 Mutation called with payload:", payload);
 
 console.log("🚀 Sending request to:", `/api/projects/${projectId}/versions/${versionId}/release`);
 const response = await apiRequest("POST", `/api/projects/${projectId}/versions/${versionId}/release`, payload);
 console.log("🚀 Response status:", response.status);
 const result = await response.json();
 console.log("🚀 Response data:", result);
 return result;
 },
 onSuccess: (data) => {
 console.log('Mutation success:', data);
 // Invalidate all related queries
 queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions`] });
 queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
 queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
 if (data.releaseId) {
 queryClient.invalidateQueries({ queryKey: [`/api/releases/${data.releaseId}`] });
 queryClient.invalidateQueries({ queryKey: [`/api/releases/${data.releaseId}/project-versions`] });
 }
 
 toast({
 title: "Succès",
 description: `Version ${versionName} associée à la release avec succès`,
 });
 onOpenChange(false);
 existingForm.reset();
 newForm.reset();
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

 const onSubmitExisting = (data: ExistingReleaseFormData) => {
 console.log("🎯 onSubmitExisting called with data:", data);
 
 const payload = {
 releaseId: parseInt(data.releaseId, 10)
 };
 
 console.log("✅ Existing release validation passed, calling mutation with:", payload);
 mutation.mutate(payload);
 };

 const onSubmitNew = (data: NewReleaseFormData) => {
 console.log("🎯 onSubmitNew called with data:", data);
 
 const payload = {
 createRelease: {
 ...data,
 recetteDate: data.recetteDate || null,
 preprodDate: data.preprodDate || null,
 productionDate: data.productionDate || null,
 }
 };
 
 console.log("✅ New release validation passed, calling mutation with:", payload);
 mutation.mutate(payload);
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

 <TabsContent value="existing" className="space-y-4">
 <Form {...existingForm}>
 <form onSubmit={existingForm.handleSubmit(onSubmitExisting)} className="space-y-4">
 <FormField
 control={existingForm.control}
 name="releaseId"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Sélectionner une release</FormLabel>
 <Select 
 onValueChange={(value) => {
 console.log("🔧 Select value changed:", value, "type:", typeof value);
 field.onChange(value);
 }} 
 value={field.value}
 >
 <FormControl>
 <SelectTrigger>
 <SelectValue placeholder="Choisissez une release existante" />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 {releases.map((release: any) => (
 <SelectItem key={release.id} value={release.id.toString()}>
 <div className="flex items-center space-x-2">
 <span className="font-medium">{release.releaseId}</span>
 <span>-</span>
 <span>{release.name}</span>
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

 <div className="flex justify-end gap-2 pt-4">
 <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
 Annuler
 </Button>
 <Button 
 type="submit" 
 disabled={mutation.isPending}
 onClick={() => console.log("🎯 Existing Button clicked!")}
 >
 {mutation.isPending ? "Association..." : "Associer"}
 </Button>
 </div>
 </form>
 </Form>
 </TabsContent>

 <TabsContent value="new" className="space-y-4">
 <Form {...newForm}>
 <form onSubmit={newForm.handleSubmit(onSubmitNew)} className="space-y-4">
 <FormField
 control={newForm.control}
 name="name"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Nom de la release (optionnel)</FormLabel>
 <FormControl>
 <Input placeholder="Nom de la nouvelle release" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={newForm.control}
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

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <FormField
 control={newForm.control}
 name="recetteDate"
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
 control={newForm.control}
 name="preprodDate"
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
 control={newForm.control}
 name="productionDate"
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

 <div className="flex justify-end gap-2 pt-4">
 <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
 Annuler
 </Button>
 <Button 
 type="submit" 
 disabled={mutation.isPending}
 onClick={() => console.log("🎯 New Button clicked!")}
 >
 {mutation.isPending ? "Création..." : "Créer et associer"}
 </Button>
 </div>
 </form>
 </Form>
 </TabsContent>
 </Tabs>
 </DialogContent>
 </Dialog>
 );
}