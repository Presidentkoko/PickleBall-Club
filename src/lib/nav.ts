import type { ComponentType } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  MapPin,
  Medal,
  Megaphone,
  Settings,
  ShieldCheck,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { ROLES } from "@/lib/auth/rbac";

export type NavIcon = ComponentType<{ className?: string }>;
export type NavItem = { href: string; label: string; icon: NavIcon; roles?: string[] };

const STAFF_PLUS = [ROLES.OWNER, ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF];
const ADMIN_PLUS = [ROLES.OWNER, ROLES.SUPER_ADMIN, ROLES.ADMIN];
const OWNERS = [ROLES.OWNER, ROLES.SUPER_ADMIN];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: STAFF_PLUS },
  { href: "/admin/applications", label: "Applications", icon: ClipboardCheck, roles: ADMIN_PLUS },
  { href: "/admin/members", label: "Members", icon: Users, roles: ADMIN_PLUS },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, roles: ADMIN_PLUS },
  { href: "/admin/open-play", label: "Open Play", icon: CalendarDays, roles: STAFF_PLUS },
  { href: "/admin/bookings", label: "Bookings", icon: MapPin, roles: STAFF_PLUS },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy, roles: STAFF_PLUS },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, roles: ADMIN_PLUS },
  { href: "/admin/reports", label: "Reports", icon: FileText, roles: ADMIN_PLUS },
  { href: "/admin/team", label: "Team", icon: ShieldCheck, roles: OWNERS },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ADMIN_PLUS },
];

export const memberNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/open-play", label: "Open Play", icon: CalendarDays },
  { href: "/dashboard/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/dashboard/bookings", label: "Bookings", icon: MapPin },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Medal },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];
