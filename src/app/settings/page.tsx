"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Upload, FileText, Image as ImageIcon, Loader2, Sparkles, Twitter, Facebook, Save, Check, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Gem, SocialAccount } from "@/types";

export default function SettingsPage() {
    const [gems, setGems] = useState<Gem[]>([]);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);

    // New Account State
    const [newTwitterHandle, setNewTwitterHandle] = useState("");
    const [newFacebookPage, setNewFacebookPage] = useState("");

    useEffect(() => {
        const fetchGems = async () => {
            try {
                const res = await fetch("/api/gems");
                if (res.ok) {
                    const data = await res.json();
                    setGems(data);
                }
            } catch (error) {
                console.error("Failed to load gems:", error);
            }
        };
        fetchGems();

        const fetchAccounts = async () => {
            try {
                const res = await fetch("/api/accounts");
                if (res.ok) {
                    setAccounts(await res.json());
                }
            } catch (error) {
                console.error("Failed to load accounts:", error);
            }
        };
        fetchAccounts();
    }, []);

    const addTwitterAccount = async () => {
        if (!newTwitterHandle) return;

        try {
            const res = await fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: 'twitter',
                    name: newTwitterHandle
                })
            });

            if (res.ok) {
                const newAccount = await res.json();
                setAccounts([...accounts, newAccount]);
                setNewTwitterHandle("");
            }
        } catch (error) {
            console.error("Failed to add account:", error);
        }
    };

    const addFacebookAccount = async () => {
        if (!newFacebookPage) return;

        try {
            const res = await fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: 'facebook',
                    name: newFacebookPage
                })
            });

            if (res.ok) {
                const newAccount = await res.json();
                setAccounts([...accounts, newAccount]);
                setNewFacebookPage("");
            }
        } catch (error) {
            console.error("Failed to add account:", error);
        }
    };

    const deleteAccount = async (id: string) => {
        try {
            const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
            if (res.ok) {
                setAccounts(accounts.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error("Failed to delete account:", error);
        }
    };

    const handleCreateGem = async () => {
        try {
            const res = await fetch("/api/gems", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "New Persona",
                    instructions: "You are a helpful assistant.",
                    files: []
                })
            });

            if (res.ok) {
                const newGem = await res.json();
                setGems([newGem, ...gems]);
                setSelectedGemId(newGem.id);
            }
        } catch (error) {
            console.error("Failed to create gem:", error);
        }
    };

    const handleDeleteGem = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this Gem?")) return;

        try {
            const res = await fetch(`/api/gems/${id}`, { method: "DELETE" });
            if (res.ok) {
                setGems(gems.filter(g => g.id !== id));
                if (selectedGemId === id) setSelectedGemId(null);
            }
        } catch (error) {
            console.error("Failed to delete gem:", error);
        }
    };

    const handleUpdateGem = async (id: string, updates: Partial<Gem>) => {
        // Optimistic update
        setGems(gems.map(g => g.id === id ? { ...g, ...updates } : g));

        try {
            await fetch(`/api/gems/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error("Failed to update gem:", error);
            // Revert on error? For now just log.
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !selectedGemId) return;
        setIsUploading(true);

        try {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            const gem = gems.find(g => g.id === selectedGemId);
            if (gem) {
                handleUpdateGem(selectedGemId, {
                    files: [...gem.files, { uri: data.uri, name: data.name, mimeType: data.mimeType }]
                });
            }
        } catch (error) {
            console.error(error);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = (gemId: string, fileUri: string) => {
        const gem = gems.find(g => g.id === gemId);
        if (gem) {
            handleUpdateGem(gemId, {
                files: gem.files.filter(f => f.uri !== fileUri)
            });
        }
    };

    const handleEnhance = async () => {
        if (!selectedGemId) return;
        const gem = gems.find(g => g.id === selectedGemId);
        if (!gem) return;

        setIsEnhancing(true);
        try {
            const res = await fetch("/api/enhance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: gem.name,
                    instructions: gem.instructions
                })
            });

            if (!res.ok) throw new Error("Enhancement failed");

            const data = await res.json();
            handleUpdateGem(selectedGemId, {
                name: data.name,
                instructions: data.instructions
            });
        } catch (error) {
            console.error(error);
            alert("Failed to enhance gem");
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleManualSave = () => {
        setShowSaveConfirmation(true);
        setTimeout(() => setShowSaveConfirmation(false), 2000);
    };

    const selectedGem = gems.find(g => g.id === selectedGemId);

    return (
        <div className="max-w-4xl mx-auto space-y-12">

            {/* GEMS SECTION */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Personas (Gems)</h1>
                        <p className="text-zinc-400">Manage your AI personas and their knowledge.</p>
                    </div>
                    <button
                        onClick={handleCreateGem}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Gem
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Gem List */}
                    <div className="space-y-3">
                        {gems.map(gem => (
                            <div
                                key={gem.id}
                                onClick={() => setSelectedGemId(gem.id)}
                                className={cn(
                                    "p-4 rounded-xl border cursor-pointer transition-all",
                                    selectedGemId === gem.id
                                        ? "bg-zinc-800 border-white/20 ring-1 ring-white/20"
                                        : "bg-zinc-900/50 border-white/5 hover:bg-zinc-800/50"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-white truncate">{gem.name}</span>
                                    <button
                                        onClick={(e) => handleDeleteGem(gem.id, e)}
                                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <FileText className="w-3 h-3" />
                                    {gem.files.length} files
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Gem Editor */}
                    <div className="md:col-span-2">
                        {selectedGem ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={selectedGem.id}
                                className="space-y-6 p-6 rounded-2xl bg-zinc-900/50 border border-white/5"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Gem Name</label>
                                    <input
                                        type="text"
                                        value={selectedGem.name}
                                        onChange={(e) => handleUpdateGem(selectedGem.id, { name: e.target.value })}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-zinc-400">System Instructions</label>
                                        <button
                                            onClick={handleEnhance}
                                            disabled={isEnhancing}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg cursor-pointer transition-colors text-xs text-purple-300 hover:text-purple-200"
                                        >
                                            {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                            Enhance with AI
                                        </button>
                                    </div>
                                    <textarea
                                        value={selectedGem.instructions}
                                        onChange={(e) => handleUpdateGem(selectedGem.id, { instructions: e.target.value })}
                                        className="w-full h-40 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                                        placeholder="Define your persona's behavior, tone, and style..."
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-zinc-400">Knowledge Base</label>
                                        <label className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors text-xs text-white">
                                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                            Upload File
                                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        {selectedGem.files.length === 0 && (
                                            <p className="text-sm text-zinc-600 italic">No files uploaded yet.</p>
                                        )}
                                        {selectedGem.files.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {file.mimeType.startsWith('image/') ? (
                                                        <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                                                    ) : (
                                                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                                    )}
                                                    <span className="text-sm text-zinc-300 truncate">{file.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveFile(selectedGem.id, file.uri)}
                                                    className="text-zinc-500 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={handleManualSave}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200",
                                            showSaveConfirmation
                                                ? "bg-green-500 text-white"
                                                : "bg-white text-black hover:bg-zinc-200"
                                        )}
                                    >
                                        {showSaveConfirmation ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>

                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 p-12 border border-dashed border-white/10 rounded-2xl">
                                <Sparkles className="w-12 h-12 opacity-20" />
                                <p>Select a Gem to edit or create a new one</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* ACCOUNTS SECTION */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Social Accounts</h2>
                    <p className="text-zinc-400">Configure destinations for your posts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Twitter Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Twitter className="w-5 h-5 text-blue-400" />
                            Twitter Accounts
                        </h3>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTwitterHandle}
                                onChange={(e) => setNewTwitterHandle(e.target.value)}
                                placeholder="@username"
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={addTwitterAccount}
                                disabled={!newTwitterHandle}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {accounts.filter(a => a.platform === 'twitter').map(account => (
                                <div key={account.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <Twitter className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{account.name}</p>
                                            <p className="text-xs text-zinc-500">Twitter Account</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteAccount(account.id)}
                                        className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {accounts.filter(a => a.platform === 'twitter').length === 0 && (
                                <p className="text-sm text-zinc-500 text-center py-4">No Twitter accounts added yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Facebook Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Facebook className="w-5 h-5 text-blue-600" />
                            Facebook Pages
                        </h3>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newFacebookPage}
                                onChange={(e) => setNewFacebookPage(e.target.value)}
                                placeholder="Page Name"
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-600"
                            />
                            <button
                                onClick={addFacebookAccount}
                                disabled={!newFacebookPage}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {accounts.filter(a => a.platform === 'facebook').map(account => (
                                <div key={account.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                                            <Facebook className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{account.name}</p>
                                            <p className="text-xs text-zinc-500">Facebook Page</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteAccount(account.id)}
                                        className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {accounts.filter(a => a.platform === 'facebook').length === 0 && (
                                <p className="text-sm text-zinc-500 text-center py-4">No Facebook pages added yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
