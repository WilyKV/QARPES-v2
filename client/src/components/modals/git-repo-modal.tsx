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
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { type GitRepo, type GitRepoWithDetails, type ProjectVersionWithDetails } from "@shared/schema";
import { z } from "zod";
import { useState, useEffect } from "react";

const formSchema = z.object({
 name: z.string().min(1, "Le nom est requis"),
 url: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
 message: "URL invalide"
 }),
});

type FormData = z.infer<typeof formSchema>;

interface GitRepoModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 projectVersionId: number;
 projectId: number;
 versionId: number;
 gitRepo?: GitRepo;
}

export function GitRepoModal({ 
 open, 
 onOpenChange, 
 projectVersionId, 
 projectId, 
 versionId, 
 gitRepo 
}: GitRepoModalProps) {
 const { toast } = useToast();
 const queryClient = useQueryClient();
 const isEditing = !!gitRepo;
 const [isCreatingNew, setIsCreatingNew] = useState(false);

 // Récupérer les détails de la version pour obtenir la release associée
 const { data: version } = useQuery<ProjectVersionWithDetails>({
 queryKey: [`/api/projects/${projectId}/versions/${versionId}`],
 enabled: open,
 });

 // Récupérer tous les repositories Git existants pour permettre la sélection
 const { data: allGitRepos = [] } = useQuery<GitRepoWithDetails[]>({
 queryKey: ["/api/git-repos/all"],
 enabled: open && !isEditing,
 });



 const form = useForm<FormData>({
 resolver: zodResolver(formSchema),
 defaultValues: {
 name: gitRepo?.name || "",
 url: gitRepo?.url || "",
 },
 });

 useEffect(() => {
 if (isEditing && gitRepo) {
 form.reset({
 name: String(gitRepo.name),
 url: gitRepo.url ? String(gitRepo.url) : "",
 });
 } else if (!isEditing && open) {
 // Quand la modale s'ouvre en mode création, commencer par la sélection
 setIsCreatingNew(false);
 form.reset({
 name: "",
 url: "",
 });
 }
 }, [gitRepo, isEditing, form, open]);

 const mutation = useMutation({
 mutationFn: async (data: FormData) => {
 if (isEditing) {
 return await apiRequest("PATCH", `/api/git-repos/${gitRepo.id}`, data);
 } else {
 return await apiRequest("POST", `/api/projects/${projectId}/versions/${versionId}/git-repos`, data);
 }
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
 queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/git-repos`] });
 queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions`] });
 toast({
 title: "Succès",
 description: `Repository ${isEditing ? "modifié" : "créé"} avec succès`,
 });
 onOpenChange(false);
 form.reset();
 setIsCreatingNew(false);
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
 description: `Impossible de ${isEditing ? "modifier" : "créer"} le repository`,
 variant: "destructive",
 });
 },
 });

 const handleSelectExistingRepo = async (repoId: string) => {
 if (repoId === "new") {
 setIsCreatingNew(true);
 return;
 }

 const selectedRepo = allGitRepos.find(repo => String(repo.id) === repoId);
 if (selectedRepo) {
 try {
 // Associer le repository existant à la version de projet
 await apiRequest("POST", `/api/projects/${projectId}/versions/${versionId}/git-repos`, {
 existingRepoId: Number(repoId),
 });
 
 queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
 queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/git-repos`] });
 queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions`] });
 toast({
 title: "Succès",
 description: "Repository associé avec succès",
 });
 onOpenChange(false);
 } catch (error) {
 if (isUnauthorizedError(error as Error)) {
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
 description: "Impossible d'associer le repository",
 variant: "destructive",
 });
 }
 }
 };

 const onSubmit = (data: FormData) => {
 mutation.mutate(data);
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle>
 {isEditing ? "Modifier le repository" : "Repository Git"}
 </DialogTitle>
 </DialogHeader>

 {!isEditing && !isCreatingNew && (
 <div className="space-y-4">
 <div>
 <label className="text-sm font-medium">Repository Git</label>
 <p className="text-xs text-gray-500 mt-1 mb-3">
 Choisissez un repository existant ou créez-en un nouveau
 </p>
 <Select onValueChange={handleSelectExistingRepo}>
 <SelectTrigger>
 <SelectValue placeholder="Sélectionner un repository..." />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="new">✨ Créer un nouveau repository</SelectItem>
 {allGitRepos.length > 0 && (
 <>
 <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b">
 Repositories existants
 </div>
 {allGitRepos.map((repo) => (
 <SelectItem key={String(repo.id)} value={String(repo.id)}>
 <div className="flex flex-col items-start">
 <span className="font-medium">{String(repo.name)}</span>
 {repo.url && (
 <span className="text-xs text-gray-500 truncate max-w-[200px]">
 {String(repo.url)}
 </span>
 )}
 </div>
 </SelectItem>
 ))}
 </>
 )}
 </SelectContent>
 </Select>
 </div>
 </div>
 )}

 {(isEditing || isCreatingNew) && (
 <div className="space-y-4">
 {!isEditing && (
 <div className="flex items-center gap-2 pb-2 border-b">
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => setIsCreatingNew(false)}
 >
 ← Retour à la sélection
 </Button>
 </div>
 )}
 
 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
 <FormField
 control={form.control}
 name="name"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Nom du repository</FormLabel>
 <FormControl>
 <Input placeholder="my-project-repo" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="url"
 render={({ field }) => (
 <FormItem>
 <FormLabel>URL du repository (optionnel)</FormLabel>
 <FormControl>
 <Input 
 placeholder="https://github.com/user/repo.git" 
 {...field}
 value={field.value || ""}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />



 <div className="flex justify-end gap-2">
 <Button 
 type="button" 
 variant="outline" 
 onClick={() => {
 if (!isEditing) {
 setIsCreatingNew(false);
 } else {
 onOpenChange(false);
 }
 }}
 >
 {isEditing ? "Annuler" : "Retour"}
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
 </div>
 )}
 </DialogContent>
 </Dialog>
 );
}