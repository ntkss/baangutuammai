"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, BarChart3, Map, Settings } from "lucide-react";
import { NAV_LABELS } from "@/lib/i18n/th";

const navItems = [
  { href: "/", label: NAV_LABELS.home, icon: Home, id: "nav-home" },
  {
    href: "/triggers",
    label: NAV_LABELS.triggers,
    icon: Zap,
    id: "nav-triggers",
  },
  {
    href: "/2554",
    label: NAV_LABELS.history2554,
    icon: BarChart3,
    id: "nav-2554",
  },
  { href: "/map", label: NAV_LABELS.map, icon: Map, id: "nav-map" },
  {
    href: "/settings",
    label: NAV_LABELS.settings,
    icon: Settings,
    id: "nav-settings",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-bar" aria-label="เมนูหลัก">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const IconComponent = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            id={item.id}
            className={`nav-item${isActive ? " nav-item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="nav-item__icon" aria-hidden="true">
              <IconComponent size={20} strokeWidth={isActive ? 2.3 : 1.8} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
