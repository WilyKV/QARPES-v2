import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock } from "lucide-react";

export default function ADRPage() {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
 <Sidebar />

 <main className="flex-1 overflow-auto ml-64">
 <Header
 title="Architecture Decision Records"
 subtitle="Documentation des décisions architecturales"
 />

 <div className="p-6">
 <NotificationBanner />

 <Card className="max-w-2xl mx-auto">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Clock className="h-5 w-5" />
 Fonctionnalité à venir
 </CardTitle>
 <CardDescription>
 Cette section permettra de documenter et suivre les décisions architecturales du projet.
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-3 text-sm text-muted-foreground">
 <p>Les ADR (Architecture Decision Records) permettront de :</p>
 <ul className="list-disc list-inside space-y-1 ml-2">
 <li>Documenter les décisions techniques importantes</li>
 <li>Suivre le contexte et les alternatives considérées</li>
 <li>Archiver l'historique des choix architecturaux</li>
 <li>Faciliter l'onboarding des nouveaux membres</li>
 </ul>
 </div>
 </CardContent>
 </Card>
 </div>
 </main>
 </div>
 );
}
