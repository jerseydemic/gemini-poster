import { ScheduledJob } from "@/types";

export function shouldRun(job: ScheduledJob): boolean {
    if (!job.active) return false;

    const now = Date.now();

    // 1. Interval Logic
    if (job.type === 'interval' || !job.type) { // Fallback for old jobs
        if (!job.lastRun) return true;
        const elapsed = now - job.lastRun;
        const interval = (job.intervalMinutes || 60) * 60 * 1000;
        return elapsed >= interval;
    }

    // 2. Daily Logic (EST)
    if (job.type === 'daily') {
        const timezone = job.timezone || "America/New_York";

        // Get current time in target timezone
        const nowInTz = new Date().toLocaleString("en-US", { timeZone: timezone });
        const currentDate = new Date(nowInTz);

        // Get target times (support both old single time and new array)
        const times = job.dailyTimes || (job.dailyTime ? [job.dailyTime] : []);
        if (times.length === 0) return false;

        // Find the latest scheduled time that has passed today
        let latestPassedTime: Date | null = null;

        for (const time of times) {
            const [h, m] = time.split(':').map(Number);
            const targetDate = new Date(currentDate);
            targetDate.setHours(h, m, 0, 0);

            if (currentDate >= targetDate) {
                if (!latestPassedTime || targetDate > latestPassedTime) {
                    latestPassedTime = targetDate;
                }
            }
        }

        // If no scheduled time has passed yet today, don't run
        if (!latestPassedTime) return false;

        // If we have a passed time, check if we already ran *after* it
        if (job.lastRun) {
            const lastRunInTz = new Date(job.lastRun).toLocaleString("en-US", { timeZone: timezone });
            const lastRunDate = new Date(lastRunInTz);

            // If last run was today AND it was after or equal to the latest passed target time
            // Then we have already executed for this slot
            if (
                lastRunDate.getDate() === currentDate.getDate() &&
                lastRunDate.getMonth() === currentDate.getMonth() &&
                lastRunDate.getFullYear() === currentDate.getFullYear() &&
                lastRunDate >= latestPassedTime
            ) {
                return false;
            }
        }

        return true;
    }

    return false;
}
