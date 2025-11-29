"use client";

import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, Play, AlertCircle } from "lucide-react";
import { Gem, ScheduledJob } from "@/types";


export default function SchedulePage() {
    const [jobs, setJobs] = useState<ScheduledJob[]>([]);
    const [gems, setGems] = useState<Gem[]>([]);

    // Form State
    const [selectedGemId, setSelectedGemId] = useState("");
    const [scheduleType, setScheduleType] = useState<'interval' | 'daily'>('interval');

    // Interval State
    const [intervalValue, setIntervalValue] = useState("1");
    const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'hours'>('hours');

    // Daily State
    const [dailyTimes, setDailyTimes] = useState<string[]>(["09:00"]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobsRes, gemsRes] = await Promise.all([
                    fetch("/api/schedules"),
                    fetch("/api/gems")
                ]);

                if (jobsRes.ok) setJobs(await jobsRes.json());
                if (gemsRes.ok) setGems(await gemsRes.json());
            } catch (error) {
                console.error("Failed to load data:", error);
            }
        };
        fetchData();
    }, []);

    const handleAddJob = async () => {
        if (!selectedGemId) return;

        const newJob: Partial<ScheduledJob> = {
            gemId: selectedGemId,
            type: scheduleType,
            active: true,
            timezone: "America/New_York"
        };

        if (scheduleType === 'interval') {
            const val = parseInt(intervalValue);
            newJob.intervalMinutes = intervalUnit === 'hours' ? val * 60 : val;
        } else {
            newJob.dailyTimes = dailyTimes.sort();
        }

        try {
            const res = await fetch("/api/schedules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newJob)
            });

            if (res.ok) {
                const createdJob = await res.json();
                setJobs([createdJob, ...jobs]);
                setSelectedGemId("");
            }
        } catch (error) {
            console.error("Failed to add job:", error);
        }
    };

    const handleDeleteJob = async (id: string) => {
        try {
            const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
            if (res.ok) {
                setJobs(jobs.filter(j => j.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete job:", error);
        }
    };

    const toggleJob = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setJobs(jobs.map(j => j.id === id ? { ...j, active: !currentStatus } : j));

        try {
            await fetch(`/api/schedules/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !currentStatus })
            });
        } catch (error) {
            console.error("Failed to toggle job:", error);
        }
    };

    const getGemName = (id: string) => {
        return gems.find(g => g.id === id)?.name || "Unknown Gem";
    };

    const addTimeSlot = () => {
        setDailyTimes([...dailyTimes, "12:00"]);
    };

    const removeTimeSlot = (index: number) => {
        setDailyTimes(dailyTimes.filter((_, i) => i !== index));
    };

    const updateTimeSlot = (index: number, value: string) => {
        const newTimes = [...dailyTimes];
        newTimes[index] = value;
        setDailyTimes(newTimes);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <div>
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Schedule</h1>
                <p className="text-zinc-400 text-lg">Automate your posts. Keep this tab open for the scheduler to run.</p>
            </div>

            {/* Create Job */}
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/50 space-y-8">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Plus className="w-5 h-5 text-blue-400" />
                    </div>
                    Create New Schedule
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-zinc-300 ml-1">Select Gem</label>
                            <select
                                value={selectedGemId}
                                onChange={(e) => setSelectedGemId(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                                style={{ backgroundImage: 'none' }} // Remove default arrow if needed, or keep standard
                            >
                                <option value="">Select a Gem...</option>
                                {gems.map(gem => (
                                    <option key={gem.id} value={gem.id}>{gem.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-zinc-300 ml-1">Schedule Type</label>
                            <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1.5">
                                <button
                                    onClick={() => setScheduleType('interval')}
                                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${scheduleType === 'interval'
                                        ? 'bg-zinc-800 text-white shadow-lg shadow-black/20'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                                        }`}
                                >
                                    Interval
                                </button>
                                <button
                                    onClick={() => setScheduleType('daily')}
                                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${scheduleType === 'daily'
                                        ? 'bg-zinc-800 text-white shadow-lg shadow-black/20'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                                        }`}
                                >
                                    Daily (EST)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {scheduleType === 'interval' ? (
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-zinc-300 ml-1">Run Every</label>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        value={intervalValue}
                                        onChange={(e) => setIntervalValue(e.target.value)}
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    />
                                    <select
                                        value={intervalUnit}
                                        onChange={(e) => setIntervalUnit(e.target.value as 'minutes' | 'hours')}
                                        className="w-36 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    >
                                        <option value="minutes">Minutes</option>
                                        <option value="hours">Hours</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-medium text-zinc-300">Times (EST)</label>
                                    <button
                                        onClick={addTimeSlot}
                                        className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 hover:bg-blue-500/10 rounded-md transition-colors"
                                    >
                                        + Add Time
                                    </button>
                                </div>
                                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {dailyTimes.map((time, index) => (
                                        <div key={index} className="flex gap-3 group">
                                            <input
                                                type="time"
                                                value={time}
                                                onChange={(e) => updateTimeSlot(index, e.target.value)}
                                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                            />
                                            {dailyTimes.length > 1 && (
                                                <button
                                                    onClick={() => removeTimeSlot(index)}
                                                    className="p-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-500 ml-1">
                                    Will run every day at these times (America/New_York).
                                </p>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                onClick={handleAddJob}
                                disabled={!selectedGemId}
                                className="w-full px-6 py-3.5 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                            >
                                Add Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Jobs */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Clock className="w-5 h-5 text-purple-400" />
                    </div>
                    Active Schedules
                </h2>

                {jobs.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/50 text-zinc-500">
                        <p className="text-lg">No active schedules.</p>
                        <p className="text-sm mt-1">Add one above to get started!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {jobs.map(job => (
                            <div key={job.id} className="flex items-center justify-between p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors group">
                                <div className="flex items-center gap-5">
                                    <div className={`w-3 h-3 rounded-full shadow-lg shadow-current ${job.active ? 'bg-green-500 text-green-500' : 'bg-red-500 text-red-500'}`} />
                                    <div>
                                        <h3 className="font-semibold text-lg text-white mb-1">{getGemName(job.gemId)}</h3>
                                        <div className="text-sm text-zinc-400">
                                            {job.type === 'daily' ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-blue-400 font-medium">Daily (EST)</span>
                                                    <span className="text-zinc-500">
                                                        {(job.dailyTimes || [job.dailyTime]).join(", ")}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-300">Every <span className="text-white font-medium">{job.intervalMinutes}</span> minutes</span>
                                            )}
                                            {job.lastRun && (
                                                <div className="mt-1.5 text-xs text-zinc-600 flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-zinc-600" />
                                                    Last run: {new Date(job.lastRun).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleJob(job.id, job.active)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${job.active
                                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
                                            }`}
                                    >
                                        {job.active ? 'Active' : 'Paused'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteJob(job.id)}
                                        className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200/80 leading-relaxed">
                    <strong>Note:</strong> The scheduler runs in your browser. You must keep this application open in a tab for the schedules to execute.
                </p>
            </div>
        </div>
    );
}
