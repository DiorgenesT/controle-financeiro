"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { auth } from "@/lib/firebase";
import { Bot, X, Send, Loader2, Check, AlertCircle, CircleCheck, Trash2, Mic, MicOff, Volume2, VolumeX, Tag, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

// Custom types for the AI Assistant component
export type AssistantUITools = {
    addTransaction: {
        input: { description: string; amount: number; type: 'receita' | 'despesa'; category: string };
        output: { success: boolean; action: string; data: any; message: string };
    };
    saveTransaction: {
        input: { description: string; amount: number; type: 'receita' | 'despesa'; category: string };
        output: { success: boolean; message: string };
    };
    searchEntities: {
        input: { type: string; query?: string; limit?: number };
        output: { success: boolean; results: any[] };
    };
    manageTransactions: {
        input: { action: 'prepare' | 'execute'; transactions: any[] };
        output: { success: boolean; action?: string; transactions?: any[]; message: string };
    };
    manageCategory: {
        input: { action: 'create' | 'update' | 'delete'; categoryId?: string; data?: any };
        output: { success: boolean; message: string };
    };
};

export type AssistantUIMessage = UIMessage<AssistantUITools>;

const LOCAL_STORAGE_KEY = "chat-messages-v1";

export function FloatingAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Vercel AI SDK hook with dynamic Bearer Token Auth
    const { messages, status, sendMessage, error, setMessages } = useChat<AssistantUIMessage>({
        transport: new DefaultChatTransport({
            api: '/api/assistant',
            headers: async () => {
                const token = await auth.currentUser?.getIdToken();
                return {
                    'Authorization': `Bearer ${token}`
                };
            }
        }),
        initialMessages: [
            {
                id: 'welcome',
                role: 'assistant',
                parts: [{ type: 'text', text: 'Olá! Sou seu Assistente Tudo em Dia. Como posso te ajudar a organizar suas finanças agora?' }]
            }
        ],
        onError: (err: Error) => {
            console.error('AI Assistant Error:', err);
        },
        onFinish: (result: any) => {
            if (autoSpeak && result.message) {
                const text = (result.message.parts as any[])
                    .filter((p: any) => p.type === 'text')
                    .map((p: any) => p.text)
                    .join(' ');
                speak(text);
            }
        }
    } as any);

    const isLoading = status === 'streaming' || status === 'submitted';

    // 1. Load messages and settings from localStorage
    useEffect(() => {
        const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
            } catch (err) { console.error(err); }
        }

        const savedAutoSpeak = localStorage.getItem("assistant-autospeak");
        if (savedAutoSpeak === "true") setAutoSpeak(true);
    }, [setMessages]);

    // 2. Save messages and settings
    useEffect(() => {
        if (messages.length > 1) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
        }
        localStorage.setItem("assistant-autospeak", String(autoSpeak));
    }, [messages, autoSpeak]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
        };

        // Debounce/Delay slightly for animations (especially when opening)
        const timer = setTimeout(scrollToBottom, 200);
        return () => clearTimeout(timer);
    }, [messages, status, isOpen]);

    // Speech to Text Logic
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'pt-BR';
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                setInput(transcript);

                // If it's the final result, process it
                if (event.results[0].isFinal) {
                    setIsListening(false);
                    if (transcript.trim().length > 3) {
                        sendMessage({ text: transcript });
                        setInput("");
                    }
                }
            };

            recognitionRef.current.onerror = (err: any) => {
                console.error("[Assistant] STT Error:", err);
                setIsListening(false);
            };
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, [sendMessage]);

    const toggleListening = () => {
        unlockAudio(); // Unlock audio on mic toggle too
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setInput("");
            setIsListening(true);
            recognitionRef.current?.start();
        }
    };

    // State for high-quality audio playback and queue
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sentenceQueueRef = useRef<string[]>([]);
    const isProcessingQueueRef = useRef(false);

    const processQueue = async () => {
        if (isProcessingQueueRef.current || sentenceQueueRef.current.length === 0) return;
        isProcessingQueueRef.current = true;

        const preFetchSentence = async (text: string) => {
            try {
                const response = await fetch('/api/assistant/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, voice: 'nova' })
                });
                if (!response.ok) return null;
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            } catch (e) { return null; }
        };

        let currentPlayUrl: string | null = null;
        let index = 0;
        while (sentenceQueueRef.current.length > 0) {
            const sentence = sentenceQueueRef.current.shift();
            if (!sentence) continue;

            // Pre-fetch current if don't have it (first one)
            if (!currentPlayUrl) {
                currentPlayUrl = await preFetchSentence(sentence);
            }

            // Next pre-fetch
            const nextSentence = sentenceQueueRef.current[0];
            const nextUrlPromise = nextSentence ? preFetchSentence(nextSentence) : Promise.resolve(null);

            try {
                // Natural Pause between sentences (300ms)
                if (index > 0) await new Promise(res => setTimeout(res, 300));

                if (!currentPlayUrl) {
                    await new Promise<void>(res => {
                        const u = new SpeechSynthesisUtterance(sentence);
                        u.lang = 'pt-BR'; u.onend = () => res(); u.onerror = () => res();
                        window.speechSynthesis.speak(u);
                    });
                } else {
                    if (!audioRef.current) audioRef.current = new Audio();
                    const audio = audioRef.current;
                    await new Promise<void>((resolve) => {
                        audio.src = currentPlayUrl!;
                        audio.onended = () => { URL.revokeObjectURL(currentPlayUrl!); resolve(); };
                        audio.onerror = () => { URL.revokeObjectURL(currentPlayUrl!); resolve(); };
                        audio.play().catch(() => resolve());
                    });
                }
            } catch (err) {
                console.error('[Assistant] TTS Loop Error:', err);
            }

            currentPlayUrl = await nextUrlPromise;
            index++;
        }

        isProcessingQueueRef.current = false;
        setIsSpeaking(false);
    };

    // Text to Speech Logic (Turbo Sentence Chunking Upgrade)
    const speak = async (text: string) => {
        if (!text) return;

        // 1. Immediately stop current playback and clear queue
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        sentenceQueueRef.current = [];
        setIsSpeaking(true);

        // 2. Advanced Text Cleaning (Hiding IDs and Markdown)
        const cleanText = text
            .replace(/\(ID:.*?\)/g, '')               // STRICT ID Removal
            .replace(/[*#_\[\]()]/g, ' ')             // Clean basic markdown
            .replace(/R\$\s?([\d.,]+)/g, (_, amountStr) => {
                const normalized = amountStr.replace(/\./g, '');
                const [reais, centavos] = normalized.split(',');
                if (!centavos || centavos === '00') {
                    return `${reais} reais `;
                }
                return `${reais} reais e ${centavos} centavos `;
            })
            .replace(/(\d+)x/gi, ' em $1 vezes')      // Pronounce installments
            .replace(/[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}]/gu, '') // Remove emojis
            .replace(/\s+/g, ' ')                     // Normalize spacing
            .trim();

        if (!cleanText) {
            setIsSpeaking(false);
            return;
        }

        // 3. Split into sentences for low-latency streaming feel
        const sentences = cleanText
            .split(/[.!?]+\s+|\n+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (sentences.length === 0) {
            setIsSpeaking(false);
            return;
        }

        sentenceQueueRef.current = sentences;
        processQueue();
    };

    const unlockAudio = () => {
        const silence = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
        if (!audioRef.current) audioRef.current = new Audio();
        const a = audioRef.current;
        if (a.src === "" || a.src.startsWith("data:")) {
            a.src = silence;
            a.play().then(() => {
                a.pause();
                console.log("[Assistant] Audio Context Unlocked");
            }).catch(e => console.warn("[Assistant] Audio Unlock Failed", e));
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        unlockAudio();
        sendMessage({ text: input });
        setInput("");
    };

    const clearHistory = () => {
        if (confirm("Deseja apagar o histórico de mensagens?")) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    parts: [{ type: 'text', text: 'Olá! Histórico limpo. Como posso ajudar agora?' }]
                }
            ]);
        }
    };

    return (
        <div className={cn(
            "fixed z-[100] flex flex-col items-end transition-all duration-500 ease-in-out",
            isOpen ? "inset-0 md:inset-auto md:bottom-6 md:right-6" : "bottom-6 right-6"
        )}>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={cn(
                            "shadow-2xl overflow-hidden bg-background/95 backdrop-blur-xl flex flex-col",
                            "w-full h-[100dvh] md:w-[400px] md:h-[650px] md:max-h-[85vh] md:rounded-3xl md:border md:border-border/50 md:mb-4",
                            "pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 md:p-5 border-b bg-muted/30 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-bold text-foreground">Assistente Financeiro</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 rounded-full transition-colors",
                                        autoSpeak ? "text-indigo-500 bg-indigo-500/10" : "text-muted-foreground"
                                    )}
                                    onClick={() => {
                                        const newValue = !autoSpeak;
                                        setAutoSpeak(newValue);
                                        if (newValue) unlockAudio();
                                        if (!newValue) {
                                            if (audioRef.current) {
                                                audioRef.current.pause();
                                                audioRef.current.currentTime = 0;
                                            }
                                            window.speechSynthesis.cancel();
                                        }
                                    }}
                                    title={autoSpeak ? "Desativar voz" : "Ativar voz"}
                                >
                                    {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 md:h-8 md:w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-all active:scale-95"
                                    onClick={clearHistory}
                                    title="Limpar Histórico"
                                >
                                    <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 md:h-8 md:w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-foreground/80"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="w-5 h-5 md:w-4 md:h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            className="flex-1 overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
                        >
                            <div className="p-4 flex flex-col gap-4">
                                {messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            "flex flex-col max-w-[85%] px-4 py-3 text-sm transition-all duration-200 shadow-sm",
                                            m.role === 'user'
                                                ? "bg-emerald-600 text-white self-end rounded-2xl rounded-tr-sm"
                                                : "bg-muted text-foreground self-start rounded-2xl rounded-tl-sm border border-border/10"
                                        )}
                                    >
                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-snug prose-p:my-1">
                                            {m.parts.map((part, idx) => {
                                                if (part.type === 'text') {
                                                    const displayText = part.text?.replace(/\(ID:.*?\)/g, '') || '';
                                                    return <ReactMarkdown key={idx}>{displayText}</ReactMarkdown>;
                                                }

                                                if (part.type === 'tool-addTransaction') {
                                                    const res = part.output as AssistantUITools['addTransaction']['output'];
                                                    if (!res) return null;

                                                    return (
                                                        <div key={idx} className="mt-2 p-3 bg-background/50 rounded-xl border border-indigo-500/20 shadow-sm animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                                                                <Bot className="w-3 h-3" />
                                                                <span>Confirmação</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-medium leading-tight text-foreground/90">
                                                                    {res.message?.replace(/\(ID:.*?\)/g, '') || ''}
                                                                </p>

                                                                {res.action === 'requires_confirmation' && (
                                                                    <div className="flex gap-2 pt-1">
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-8 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] gap-1.5"
                                                                            onClick={() => sendMessage({ text: "Sim, pode confirmar o cadastro." })}
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                            Sim
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 flex-1 text-[11px] gap-1.5 border-border/50"
                                                                            onClick={() => sendMessage({ text: "Não, cancele por favor." })}
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                            Não
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (part.type === 'tool-manageTransactions') {
                                                    const res = part.output as AssistantUITools['manageTransactions']['output'];
                                                    if (!res) return null;

                                                    return (
                                                        <div key={idx} className="mt-2 p-3 bg-background/50 rounded-xl border border-indigo-500/20 shadow-sm animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                                                                <Bot className="w-3 h-3" />
                                                                <span>Confirmação em Lote</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-medium leading-tight text-foreground/90">
                                                                    {res.message?.replace(/\(ID:.*?\)/g, '') || ''}
                                                                </p>

                                                                {res.action === 'requires_confirmation' && res.transactions && (
                                                                    <div className="mt-2 space-y-2 border-y border-indigo-500/10 py-2 max-h-[200px] overflow-y-auto">
                                                                        {res.transactions.map((tx: any, tIdx: number) => (
                                                                            <div key={tIdx} className="bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                                                                                <div className="flex items-center justify-between text-[11px] mb-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className={cn("w-1.5 h-1.5 rounded-full", tx.type === 'receita' ? 'bg-emerald-500' : 'bg-red-500')} />
                                                                                        <span className="font-bold text-foreground/80 truncate max-w-[140px]">{tx.description}</span>
                                                                                    </div>
                                                                                    <span className={cn("font-bold", tx.type === 'receita' ? 'text-emerald-600' : 'text-red-500')}>
                                                                                        R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-muted-foreground ml-3.5">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Tag className="w-2.5 h-2.5" />
                                                                                        {tx.categoryName || tx.category || 'Sem categoria'}
                                                                                    </span>
                                                                                    <span className="flex items-center gap-1">
                                                                                        <CreditCard className="w-2.5 h-2.5" />
                                                                                        {tx.accountName || tx.creditCardName || (tx.paymentMethod === 'pix' ? 'Pix' : 'Débito/Outro')}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {res.success && !res.action && (
                                                                    <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-medium py-1">
                                                                        <CircleCheck className="w-4 h-4" />
                                                                        <span>Concluído</span>
                                                                    </div>
                                                                )}

                                                                {res.action === 'requires_confirmation' && (
                                                                    <div className="flex gap-2 pt-1">
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-8 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] gap-1.5"
                                                                            onClick={() => sendMessage({ text: "Sim, pode confirmar todos os lançamentos em lote." })}
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                            Confirmar Tudo
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8 flex-1 text-[11px] gap-1.5 border-border/50"
                                                                            onClick={() => sendMessage({ text: "Não, cancele o lote por favor." })}
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                            Cancelar
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (part.type === 'tool-saveTransaction') {
                                                    const res = part.output as AssistantUITools['saveTransaction']['output'];
                                                    if (!res) return null;

                                                    return (
                                                        <div key={idx} className="mt-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-sm">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                                                <CircleCheck className="w-3 h-3" />
                                                                <span>Salvo</span>
                                                            </div>
                                                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                                                                {res.message?.replace(/\(ID:.*?\)/g, '') || ''}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="bg-muted/50 text-foreground self-start rounded-2xl rounded-tl-sm border border-border/50 px-4 py-3 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                        <span className="text-xs text-muted-foreground animate-pulse font-medium underline underline-offset-4 decoration-indigo-500/30">Pensando...</span>
                                    </div>
                                )}
                                {error && (
                                    <div className="bg-red-500/10 text-red-600 rounded-2xl px-4 py-3 flex items-start gap-3 border border-red-500/20 animate-in fade-in duration-300">
                                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold uppercase whitespace-nowrap">Erro</span>
                                            <p className="text-xs font-medium leading-snug">
                                                {error.message === 'Unauthorized' ? 'Sessão expirada.' : 'Erro na conexão.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-px" />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 md:p-6 border-t bg-background/50 backdrop-blur-md">
                            <form
                                onSubmit={handleSendMessage}
                                className="flex items-center gap-3"
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-12 w-12 shrink-0 rounded-2xl transition-all duration-300",
                                        isListening
                                            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40"
                                            : "hover:bg-emerald-500/10 text-emerald-600 bg-emerald-500/5 border border-emerald-500/10"
                                    )}
                                    onClick={toggleListening}
                                    disabled={isLoading}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </Button>
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? "Ouvindo..." : "Algo para hoje?"}
                                    className="flex-1 h-12 rounded-2xl bg-muted/40 border-border/30 focus-visible:ring-1 focus-visible:ring-emerald-500 text-base"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="h-12 w-12 shrink-0 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/30 transition-all duration-200"
                                    disabled={isLoading || !input.trim()}
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                            <div className="mt-3 text-center text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-widest">
                                Inteligência Artificial Tudo Em Dia
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button */}
            {!isOpen && (
                <motion.button
                    id="ai-chat-trigger"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="relative group cursor-pointer"
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.6, 1],
                                opacity: [0.4, 0, 0.4],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute w-full h-full bg-indigo-500 rounded-full blur-xl"
                        />
                    </div>

                    <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.6)] border border-white/20 overflow-hidden">
                        <Bot className="w-8 h-8 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] z-10" />
                    </div>

                    <div className="absolute -top-10 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-xl">
                        Posso ajudar?
                    </div>
                </motion.button>
            )}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    display: block !important;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #10b981;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #059669;
                }
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #10b981 rgba(0, 0, 0, 0.05);
                }
            `}</style>
        </div>
    );
}
