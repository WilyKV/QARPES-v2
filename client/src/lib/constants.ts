export const STATUS_OPTIONS = {
  project: [
    { value: "development", label: "Développement" },
    { value: "testing", label: "Recette" },
    { value: "preproduction", label: "Pré-production" },
    { value: "production", label: "Production" },
  ],
  release: [
    { value: "development", label: "Développement" },
    { value: "testing", label: "Recette" },
    { value: "preproduction", label: "Pré-production" },
    { value: "production", label: "Production" },
  ],
  arb: [
    { value: "pending", label: "En attente" },
    { value: "in_review", label: "En révision" },
    { value: "approved", label: "Approuvé" },
    { value: "rejected", label: "Rejeté" },
  ],
};

export const ARB_TYPES = [
  { value: "access", label: "Accès" },
  { value: "responsibility", label: "Responsabilité" },
  { value: "budget", label: "Budget" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Élevée" },
  { value: "critical", label: "Critique" },
];

export const TEAM_MEMBER_ROLES = [
  { value: "member", label: "Membre" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

export const USER_ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "dev", label: "Développeur" },
  { value: "ops", label: "Ops" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

export const STATUS_COLORS = {
  // Project/Release statuses
  development: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  testing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  preproduction: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  
  // ARB statuses
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  
  // ARB types
  access: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  responsibility: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  budget: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  
  // Priorities
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

export const RELEASE_ID_REGEX = /^\d{6}-\d{2}$/;

export const formatCurrency = (amount?: number) => {
  if (!amount) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount / 100);
};

export const formatDate = (date?: string | Date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR");
};

export const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
};
