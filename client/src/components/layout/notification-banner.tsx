import { useQuery } from "@tanstack/react-query";
import { X, AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ActiveNotification {
 id: number;
 message: string;
 color: string;
 createdAt: string;
}

const colorConfig: Record<string, { bg: string; border: string; text: string; icon: typeof Info }> = {
 blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: Info },
 red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: AlertCircle },
 yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", icon: AlertTriangle },
 green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", icon: CheckCircle },
 orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", icon: AlertTriangle },
 purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", icon: Info },
};

export function NotificationBanner() {
 const [dismissed, setDismissed] = useState<Set<number>>(new Set());

 const { data: notifications } = useQuery<ActiveNotification[]>({
 queryKey: ["/api/notifications/active"],
 refetchInterval: 60000,
 });

 const visible = notifications?.filter(n => !dismissed.has(n.id)) ?? [];

 if (visible.length === 0) return null;

 return (
 <div className="space-y-2 mb-4">
 {visible.map(notification => {
 const config = colorConfig[notification.color] || colorConfig.blue;
 const Icon = config.icon;

 return (
 <div
 key={notification.id}
 className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${config.bg} ${config.border}`}
 >
 <Icon className={`h-4 w-4 shrink-0 ${config.text}`} />
 <p className={`flex-1 text-sm ${config.text}`}>{notification.message}</p>
 <button
 onClick={() => setDismissed(prev => new Set(prev).add(notification.id))}
 className={`shrink-0 rounded-md p-1 hover:bg-black/5 ${config.text}`}
 >
 <X className="h-3 w-3" />
 </button>
 </div>
 );
 })}
 </div>
 );
}
