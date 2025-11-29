"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, ImageIcon, Send } from "lucide-react";
import { motion } from "framer-motion";

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
    // State
    const [gems, setGems] = useState<Gem[]>([]);
    const [selectedGemId, setSelectedGemId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [step, setStep] = useState<'idle' | 'generating' | 'review'>('idle');
    const [generatedContent, setGeneratedContent] = useState<{ caption: string; imageUrl: string } | null>(null);



    useEffect(() => {
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
    }, []);



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
                    files: gem.files
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            setGeneratedContent({
                caption: data.caption,
                imageUrl: data.imageUrl
            });
            setStep('review');
        } catch (error: any) {
            console.error(error);
            alert("Failed to generate content: " + error.message);
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

        } catch (error: any) {
            console.error(error);
            alert("Failed to post: " + error.message);
        } finally {
            setPosting(false);
        }
    };

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
                        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Preview</h3>

                            {/* Editable Caption */}
                            <textarea
                                value={generatedContent.caption}
                                onChange={(e) => setGeneratedContent({ ...generatedContent, caption: e.target.value })}
                                className="w-full bg-transparent text-lg text-white border-none focus:ring-0 p-0 resize-none min-h-[100px]"
                                placeholder="Caption..."
                            />

                            {/* Image Placeholder */}
                            <div className="aspect-video rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
                                {generatedContent.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={generatedContent.imageUrl} alt="Generated" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <ImageIcon className="w-8 h-8 text-zinc-700 mx-auto" />
                                        <p className="text-sm text-zinc-600">Image generation disabled</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => {
                                    setStep('idle');
                                    setGeneratedContent(null);
                                }}
                                className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handlePost}
                                disabled={posting}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                            >
                                {posting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Approve & Post
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
