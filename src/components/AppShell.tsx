"use client";

import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { Scheduler } from "@/components/Scheduler";

export function AppShell({ children }: { children: React.ReactNode }) {
    const { status } = useSession();

    if (status === "authenticated") {
        return (
            <div className="flex min-h-screen">
                <Scheduler />
                <Sidebar />
                <main className="flex-1 ml-64 p-8">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8">
            {children}
        </main>
    );
}
