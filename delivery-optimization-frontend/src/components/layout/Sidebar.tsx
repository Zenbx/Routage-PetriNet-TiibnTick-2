"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Network,
    Truck,
    RotateCcw,
    BarChart3,
    Settings,
    Package,
    GitBranch
} from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: "Vue Globale", href: "/dashboard" },
        { icon: Network, label: "Réseau Graph", href: "/network" },
        { icon: Package, label: "Livraisons", href: "/delivery" },
        { icon: GitBranch, label: "Petri Net", href: "/petri-net" },
        { icon: RotateCcw, label: "Planification", href: "/tours/plan" },
        { icon: BarChart3, label: "Statistiques", href: "/analytics" },
    ];

    return (
        <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-[2000] flex flex-col items-center p-2 tactical-module border-slate-200/60 shadow-lg">
            <div className="mb-4 p-2 bg-slate-900 rounded-lg text-white">
                <Truck className="w-6 h-6" />
            </div>

            <nav className="flex flex-col space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`p-3 rounded-lg transition-all group relative ${isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <div className="absolute left-14 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap font-bold uppercase tracking-wider">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col space-y-2">
                <button className="p-3 text-slate-400 hover:text-slate-600 transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </aside>
    );
}
