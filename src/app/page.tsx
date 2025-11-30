"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, ImageIcon, Send, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSession, signIn } from "next-auth/react";

type GemFile = {
    uri: string;
    name: string;
    mimeType: string;
};

type Gem = {
    id: string;
    name: string;
    instructions: string;
    files: GemFile[];
};

export default function Dashboard() {
    const { status } = useSession();

    // State
    const [gems, setGems] = useState<Gem[]>([]);
    const [selectedGemId, setSelectedGemId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [step, setStep] = useState<'idle' | 'generating' | 'review'>('idle');
    const [generatedContent, setGeneratedContent] = useState<{ caption: string; imageUrl: string } | null>(null);

    const [includeImage, setIncludeImage] = useState(true);

    useEffect(() => {
        if (status !== "authenticated") return;

        // Load Gems from API
        const fetchGems = async () => {
            try {
                const res = await fetch("/api/gems");
                if (res.ok) {
                    const data = await res.json();
                    setGems(data);
                    if (data.length > 0) setSelectedGemId(data[0].id);
                }
            } catch (error) {
                console.error("Failed to load gems:", error);
            }
        };
        fetchGems();
    }, [status]);

    const handleGenerate = async () => {
        if (!selectedGemId) return;

        setLoading(true);
        setStep('generating');

        try {
            const gem = gems.find(g => g.id === selectedGemId);
            if (!gem) throw new Error("Gem not found");

            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gemId: gem.id,
                    gemName: gem.name,
                    instructions: gem.instructions,
                    files: gem.files,
                    includeImage
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setGeneratedContent({
                caption: data.caption,
                imageUrl: data.imageUrl
            });
            setStep('review');
        } catch (error) {
            console.error(error);
            alert("Failed to generate content: " + (error instanceof Error ? error.message : "Unknown error"));
            setStep('idle');
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!generatedContent) return;

        setPosting(true);
        try {
            const res = await fetch("/api/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    caption: generatedContent.caption,
                    imageUrl: generatedContent.imageUrl
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            alert("Posted successfully!");
            setStep('idle');
            setGeneratedContent(null);

        } catch (error) {
            console.error(error);
            alert("Failed to post: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setPosting(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-12">
                <div className="space-y-6 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
                            Gemini <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Poster</span>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed">
                            Create, schedule, and automate your social media presence with AI-powered personas.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button
                            onClick={() => signIn("google")}
                            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-zinc-200 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Get Started with Google
                        </button>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left"
                >
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-white">AI Content Creation</h3>
                        <p className="text-sm text-zinc-400">Generate engaging captions and images tailored to your brand voice.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-white">Custom Personas</h3>
                        <p className="text-sm text-zinc-400">Create unique &quot;Gems&quot; with specific instructions and knowledge bases.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 space-y-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Send className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="font-semibold text-white">Multi-Platform</h3>
                        <p className="text-sm text-zinc-400">Seamlessly post to Twitter, Facebook, and more from one dashboard.</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Dashboard</h1>
                <p className="text-zinc-400 text-lg">Generate and post content with your Gems.</p>
            </div>

            {/* Generator Section */}
            <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/50 space-y-8">
                {step === 'idle' && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-zinc-300 ml-1">Select a Gem</label>
                            <select
                                value={selectedGemId}
                                onChange={(e) => setSelectedGemId(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none"
                            >
                                {gems.length === 0 && <option value="">No Gems Found</option>}
                                {gems.map(gem => (
                                    <option key={gem.id} value={gem.id}>{gem.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Selected Gem Assets */}
                        {selectedGemId && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {gems.find(g => g.id === selectedGemId)?.files.map((file, index) => (
                                    <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-800 flex-shrink-0 group">
                                        {file.mimeType.startsWith('image/') ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={file.uri} alt={file.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                                                File
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[10px] text-white font-medium px-1 truncate max-w-full">{file.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${includeImage ? 'bg-purple-500/10' : 'bg-zinc-800'}`}>
                                    <ImageIcon className={`w-4 h-4 ${includeImage ? 'text-purple-400' : 'text-zinc-500'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Generate Image</p>
                                    <p className="text-xs text-zinc-500">Create an AI image to match your caption</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIncludeImage(!includeImage)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${includeImage ? 'bg-purple-600' : 'bg-zinc-700'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${includeImage ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading || gems.length === 0 || !selectedGemId}
                            className="w-full px-6 py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating Magic...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    Generate Content
                                </>
                            )}
                        </button>
                    </div>
                )}

                {step === 'generating' && (
                    <div className="py-12 text-center space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
                        <p className="text-zinc-400 animate-pulse">Crafting the perfect post...</p>
                    </div>
                )}

                {step === 'review' && generatedContent && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="max-w-xl mx-auto bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                            {/* Tweet Header */}
                            <div className="flex items-start gap-3 p-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                                    G
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 text-[15px]">
                                        <span className="font-bold text-white truncate">Gemini User</span>
                                        <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/10" />
                                        <span className="text-zinc-500 truncate">@gemini_poster · Just now</span>
                                    </div>

                                    {/* Editable Caption */}
                                    <textarea
                                        value={generatedContent.caption}
                                        onChange={(e) => setGeneratedContent({ ...generatedContent, caption: e.target.value })}
                                        className="w-full bg-transparent text-[15px] text-white border-none focus:ring-0 p-0 resize-none mt-1 min-h-[60px] leading-normal placeholder-zinc-600"
                                        placeholder="What is happening?!"
                                    />

                                    {/* Image Attachment */}
                                    {generatedContent.imageUrl && (
                                        <div className="mt-3 rounded-2xl border border-zinc-800 overflow-hidden relative group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={generatedContent.imageUrl} alt="Generated" className="w-full h-auto max-h-[500px] object-cover" />
                                        </div>
                                    )}

                                    {/* Tweet Actions */}
                                    <div className="flex items-center justify-between mt-4 text-zinc-500 max-w-md">
                                        <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-400">
                                            <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></g></svg>
                                            </div>
                                            <span className="text-xs">24</span>
                                        </div>
                                        <div className="flex items-center gap-2 group cursor-pointer hover:text-green-400">
                                            <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><g><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.32 9.48.04 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.18-1.93 1.28 1.46-4.46 4.15-4.46-4.15 1.28-1.46 2.18 1.93V8c0-1.1-.896-2-2-2z"></path></g></svg>
                                            </div>
                                            <span className="text-xs">12</span>
                                        </div>
                                        <div className="flex items-center gap-2 group cursor-pointer hover:text-pink-600">
                                            <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><g><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.5 4.798 2.01 1.429-1.51 3.147-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></g></svg>
                                            </div>
                                            <span className="text-xs">148</span>
                                        </div>
                                        <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-400">
                                            <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><g><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></g></svg>
                                            </div>
                                            <span className="text-xs">1.2k</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                            <button
                                onClick={() => {
                                    setStep('idle');
                                    setGeneratedContent(null);
                                }}
                                className="px-6 py-3 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 transition-colors border border-zinc-800"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handlePost}
                                disabled={posting}
                                className="px-6 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-400 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                            >
                                {posting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Post Now
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
