"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LABELS } from "@/lib/i18n/th";

const navItems = [
  { href: "/", label: NAV_LABELS.home, icon: "🏠", id: "nav-home" },
  {
    href: "/triggers",
    label: NAV_LABELS.triggers,
    icon: "⚡",
    id: "nav-triggers",
  },
  { href: "/map", label: NAV_LABELS.map, icon: "🗺️", id: "nav-map" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-bar" aria-label="เมนูหลัก">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            id={item.id}
            className={`nav-item${isActive ? " nav-item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="nav-item__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
