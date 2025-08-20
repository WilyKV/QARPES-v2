import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, User } from "lucide-react";
import type { TeamWithMembers, User as UserType } from "@shared/schema";

interface TeamMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamWithMembers | null;
}

export function TeamMembersModal({ open, onOpenChange, team }: TeamMembersModalProps) {
  // Récupérer les membres de l'équipe
  const { data: members = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/teams/${team?.id}/members`],
    enabled: open && !!team?.id,
    retry: false,
  });

  // Récupérer tous les utilisateurs pour avoir les infos complètes
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    enabled: open,
    retry: false,
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Membres de l'équipe : {team?.name}</span>
            <Badge variant="secondary">{members.length}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun membre dans cette équipe</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {members.map((member: any) => {
                const memberUser = users.find((u: any) => u.id === member.member?.user?.id);
                const isLeader = team?.leaderId === member.member?.user?.id;
                
                return (
                  <div 
                    key={member.member?.user?.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={memberUser?.profileImageUrl} />
                        <AvatarFallback className="text-sm">
                          {getInitials(memberUser?.firstName, memberUser?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">
                            {memberUser?.firstName} {memberUser?.lastName}
                          </p>
                          {isLeader && (
                            <Badge variant="default" className="bg-blue-600">
                              Chef d'équipe
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                          <Mail className="h-3 w-3 mr-1" />
                          {memberUser?.email}
                        </p>
                        {memberUser?.role && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {memberUser.role}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      {member.createdAt && (
                        <p>
                          Ajouté le {new Date(member.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
