"use client";

import { useEffect, useRef } from "react";
import { shouldRun } from "@/lib/scheduler";
import { Gem, ScheduledJob } from "@/types";

export function Scheduler() {
    const processingRef = useRef(false);

    useEffect(() => {
        const checkJobs = async () => {
            if (processingRef.current) return;

            try {
                // 1. Fetch Jobs
                const jobsRes = await fetch("/api/schedules");
                if (!jobsRes.ok) return;
                const jobs: ScheduledJob[] = await jobsRes.json();

                const dueJobs = jobs.filter(shouldRun);

                if (dueJobs.length === 0) return;

                processingRef.current = true;
                console.log(`[Scheduler] Found ${dueJobs.length} due jobs.`);

                for (const job of dueJobs) {
                    try {
                        console.log(`[Scheduler] Running job for Gem ${job.gemId}`);

                        // 2. Get Gem Details (Fetch fresh)
                        // We could fetch all gems, but fetching specific one is better if we have an endpoint, 
                        // but we don't have a specific GET /api/gems/[id] that returns the object directly yet 
                        // (PUT/DELETE exist, but GET is only list).
                        // Let's just fetch the list for now or assume we can filter.
                        const gemsRes = await fetch("/api/gems");
                        if (!gemsRes.ok) continue;
                        const gems: Gem[] = await gemsRes.json();
                        const gem = gems.find(g => g.id === job.gemId);

                        if (!gem) {
                            console.error(`[Scheduler] Gem ${job.gemId} not found, skipping.`);
                            continue;
                        }

                        // 3. Generate Content
                        const genRes = await fetch("/api/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                instructions: gem.instructions,
                                files: gem.files
                            })
                        });

                        if (!genRes.ok) throw new Error("Generation failed");
                        const genData = await genRes.json();

                        // 4. Post Content
                        const postRes = await fetch("/api/post", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                caption: genData.caption,
                                imageUrl: genData.imageUrl,
                                platforms: ["twitter"] // Default to Twitter for now
                            })
                        });

                        if (!postRes.ok) throw new Error("Posting failed");

                        console.log(`[Scheduler] Job ${job.id} completed successfully.`);

                        // 5. Update Last Run
                        await fetch(`/api/schedules/${job.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ lastRun: Date.now() })
                        });

                    } catch (error) {
                        console.error(`[Scheduler] Job ${job.id} failed:`, error);
                    }
                }
            } catch (error) {
                console.error("[Scheduler] Error checking jobs:", error);
            } finally {
                processingRef.current = false;
            }
        };

        // Check every 60 seconds
        const interval = setInterval(checkJobs, 60 * 1000);

        // Initial check after 5 seconds
        const initialTimeout = setTimeout(checkJobs, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimeout);
        };
    }, []);

    return null; // Invisible component
}
