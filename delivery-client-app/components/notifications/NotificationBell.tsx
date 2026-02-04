"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, Package, Truck, MapPin } from "lucide-react";
import { api } from "@/lib/api";

interface Notification {
    id: string;
    trackingCode: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    status: string;
}

export function NotificationBell({ trackingCode }: { trackingCode?: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (trackingCode) {
            loadNotifications();
        }
    }, [trackingCode]);

    const loadNotifications = async () => {
        if (!trackingCode) return;

        setLoading(true);
        try {
            const data = await api.getNotificationsByTrackingCode(trackingCode);
            setNotifications(data);
            const unread = data.filter((n: Notification) => n.status !== "READ").length;
            setUnreadCount(unread);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await api.markNotificationAsRead(notificationId);
            loadNotifications(); // Refresh
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "DRIVER_ASSIGNED":
                return <Truck className="w-5 h-5 text-blue-500" />;
            case "PACKAGE_PICKED_UP":
                return <Package className="w-5 h-5 text-indigo-500" />;
            case "IN_TRANSIT":
                return <MapPin className="w-5 h-5 text-purple-500" />;
            case "DEPOSITED_AT_HUB":
                return <MapPin className="w-5 h-5 text-yellow-500" />;
            case "DELIVERED":
                return <Check className="w-5 h-5 text-green-500" />;
            default:
                return <Bell className="w-5 h-5 text-primary" />;
        }
    };

    if (!trackingCode) return null;

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-surface-dark rounded-lg transition-colors"
            >
                <Bell className="w-6 h-6 text-text" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-background">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-surface-dark border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" />
                                Notifications
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-background rounded transition-colors"
                            >
                                <X className="w-5 h-5 text-text-muted" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-text-muted mx-auto mb-2" />
                                    <p className="text-text-muted text-sm">Aucune notification</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-border hover:bg-background transition-colors cursor-pointer ${notification.status !== "READ" ? "bg-primary/5" : ""
                                            }`}
                                        onClick={() => {
                                            if (notification.status !== "READ") {
                                                markAsRead(notification.id);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {getIcon(notification.type)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-medium text-white text-sm">
                                                        {notification.title}
                                                    </h4>
                                                    {notification.status !== "READ" && (
                                                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                                                    )}
                                                </div>
                                                <p className="text-text-muted text-xs mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-text-muted text-xs mt-2">
                                                    {new Date(notification.createdAt).toLocaleString("fr-FR")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
