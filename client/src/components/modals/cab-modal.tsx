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
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { type Cab } from "@shared/schema";
import { z } from "zod";

const formSchema = z
 .object({
 environment: z.enum(["preprod", "prod"], {
 required_error: "L'environnement est requis",
 }),
 helpdeskUrl: z.string().url("L'URL doit être valide").min(1, "L'URL Helpdesk est requise"),
 status: z.enum(["cree", "demande", "valide", "refuse"], {
 required_error: "Le statut est requis",
 }),
 })
 .strict();

type FormData = z.infer<typeof formSchema>;

const environmentLabels = {
 preprod: "Pré-production",
 prod: "Production",
};

const statusLabels = {
 cree: "Créé",
 demande: "Demandé", 
 valide: "Validé",
 refuse: "Refusé",
};

interface CabModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 projectVersionId: number;
 projectId: number;
 versionId: number;
 cab?: Cab;
}

export function CabModal({
 open,
 onOpenChange,
 projectVersionId,
 projectId,
 versionId,
 cab,
}: CabModalProps) {
 const { toast } = useToast();
 const queryClient = useQueryClient();

 const form = useForm<FormData, unknown, FormData>({
 resolver: zodResolver(formSchema),
 defaultValues: {
 environment: (cab?.environment as "preprod" | "prod") || "preprod",
 helpdeskUrl: cab?.helpdeskUrl || "",
 status: (cab?.status as "cree" | "demande" | "valide" | "refuse") || "cree",
 },
 });

 const mutation = useMutation({
 mutationFn: async (data: FormData) => {
 const url = cab
 ? `/api/projects/${projectId}/versions/${versionId}/pvs/${projectVersionId}/cabs/${cab.id}`
 : `/api/projects/${projectId}/versions/${versionId}/pvs/${projectVersionId}/cabs`;
 
 const method = cab ? "PUT" : "POST";
 
 return apiRequest(method, url, data);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({
 queryKey: ["project-version", projectVersionId],
 });
 toast({
 title: cab ? "CAB modifié" : "CAB créé",
 description: cab ? "Le CAB a été modifié avec succès." : "Le CAB a été créé avec succès.",
 });
 onOpenChange(false);
 form.reset();
 },
 onError: (error: any) => {
 if (isUnauthorizedError(error)) {
 toast({
 title: "Session expirée",
 description: "Veuillez vous reconnecter.",
 variant: "destructive",
 });
 return;
 }

 toast({
 title: "Erreur",
 description: cab 
 ? "Une erreur est survenue lors de la modification du CAB."
 : "Une erreur est survenue lors de la création du CAB.",
 variant: "destructive",
 });
 },
 });

 const onSubmit = (data: FormData) => {
 mutation.mutate(data);
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>{cab ? "Modifier le CAB" : "Créer un CAB"}</DialogTitle>
 </DialogHeader>
 <div className="grid gap-4 py-4">
 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
 <FormField
 control={form.control}
 name="environment"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Environnement</FormLabel>
 <Select
 onValueChange={field.onChange}
 defaultValue={field.value}
 >
 <FormControl>
 <SelectTrigger>
 <SelectValue placeholder="Sélectionner un environnement" />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 {Object.entries(environmentLabels).map(([value, label]) => (
 <SelectItem key={value} value={value}>
 {label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="helpdeskUrl"
 render={({ field }) => (
 <FormItem>
 <FormLabel>URL Helpdesk</FormLabel>
 <FormControl>
 <Input 
 placeholder="https://helpdesk.example.com/ticket/123"
 type="url"
 {...field} 
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />

 <FormField
 control={form.control}
 name="status"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Statut</FormLabel>
 <Select
 onValueChange={field.onChange}
 defaultValue={field.value}
 >
 <FormControl>
 <SelectTrigger>
 <SelectValue placeholder="Sélectionner un statut" />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 {Object.entries(statusLabels).map(([value, label]) => (
 <SelectItem key={value} value={value}>
 {label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />

 <div className="flex justify-end space-x-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => onOpenChange(false)}
 >
 Annuler
 </Button>
 <Button type="submit" disabled={mutation.isPending}>
 {mutation.isPending
 ? "En cours..."
 : cab
 ? "Modifier"
 : "Créer"}
 </Button>
 </div>
 </form>
 </Form>
 </div>
 </DialogContent>
 </Dialog>
 );
}
