import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Releases from "@/pages/releases";
import ReleaseDetail from "@/pages/release-detail";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import VersionDetail from "@/pages/version-detail";
import Teams from "@/pages/teams";
import Members from "@/pages/members";
import ARBPage from "@/pages/arb";
import ADRPage from "@/pages/adr";
import UsersPage from "@/pages/users";
import AdminSettingsPage from "@/pages/admin-settings";
import SecurityAnnouncementsPage from "@/pages/security-announcements";

// Composant de protection des routes
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
 const { isAuthenticated, isLoading } = useAuth();
 const [location, setLocation] = useLocation();
 const { toast } = useToast();

 useEffect(() => {
 if (!isLoading && !isAuthenticated) {
 toast({
 title: "Non autorisé",
 description: "Vous devez être connecté pour accéder à cette page.",
 variant: "destructive",
 });
 setLocation("/");
 }
 }, [isAuthenticated, isLoading, setLocation, toast]);

 if (isLoading) {
 return (
 <div className="flex items-center justify-center min-h-screen">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
 <p className="mt-4 text-gray-600">Chargement...</p>
 </div>
 </div>
 );
 }

 if (!isAuthenticated) {
 return null;
 }

 return <Component />;
}

function Router() {
 const { isAuthenticated, isLoading } = useAuth();

 return (
 <Switch>
 <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
 <Route path="/releases">
 {() => <ProtectedRoute component={Releases} />}
 </Route>
 <Route path="/releases/:id">
 {() => <ProtectedRoute component={ReleaseDetail} />}
 </Route>
 <Route path="/projects">
 {() => <ProtectedRoute component={Projects} />}
 </Route>
 <Route path="/projects/:id">
 {() => <ProtectedRoute component={ProjectDetail} />}
 </Route>
 <Route path="/projects/:projectId/versions/:versionId">
 {() => <ProtectedRoute component={VersionDetail} />}
 </Route>
 <Route path="/teams">
 {() => <ProtectedRoute component={Teams} />}
 </Route>
 <Route path="/members">
 {() => <ProtectedRoute component={Members} />}
 </Route>
 <Route path="/arb">
 {() => <ProtectedRoute component={ARBPage} />}
 </Route>
 <Route path="/adr">
 {() => <ProtectedRoute component={ADRPage} />}
 </Route>
 <Route path="/admin/users">
 {() => <ProtectedRoute component={UsersPage} />}
 </Route>
 <Route path="/admin/settings">
 {() => <ProtectedRoute component={AdminSettingsPage} />}
 </Route>
 <Route path="/security/announcements">
 {() => <ProtectedRoute component={SecurityAnnouncementsPage} />}
 </Route>
 <Route component={NotFound} />
 </Switch>
 );
}

function App() {
 return (
 <QueryClientProvider client={queryClient}>
 <TooltipProvider>
 <Toaster />
 <Router />
 </TooltipProvider>
 </QueryClientProvider>
 );
}

export default App;
