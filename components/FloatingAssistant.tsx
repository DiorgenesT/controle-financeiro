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

        // Debounce/Delay slightly for animations
        const timer = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timer);
    }, [messages, status]);

    // Speech to Text Logic
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'pt-BR';
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                // Auto-send if it's a clear command
                if (transcript.length > 3) {
                    sendMessage({ text: transcript });
                    setInput("");
                }
            };

            recognitionRef.current.onerror = () => setIsListening(false);
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

    // State for high-quality audio playback
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Text to Speech Logic (Premium OpenAI TTS Upgrade)
    const speak = async (text: string) => {
        if (!text) return;

        // Stop any current audio WITHOUT destroying the element
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }

        // 1. Advanced Text Cleaning (Hiding IDs and Markdown)
        const cleanText = text
            .replace(/\(ID:.*?\)/g, '')               // STRICT ID Removal
            .replace(/[*#_\[\]()]/g, '')              // Clean basic markdown
            .replace(/R\$\s?([\d.,]+)/g, (_, amountStr) => {
                const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
                if (isNaN(amount)) return amountStr;
                const reals = Math.floor(amount);
                const cents = Math.round((amount - reals) * 100);
                const parts = [];
                if (reals > 0) parts.push(`${reals} ${reals === 1 ? 'real' : 'reais'}`);
                if (cents > 0) parts.push(`${cents} ${cents === 1 ? 'centavo' : 'centavos'}`);
                return parts.length > 0 ? parts.join(' e ') : "zero reais";
            })
            .replace(/(\d+)x/gi, '$1 vezes')          // Pronounce installments (10x -> 10 vezes)
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')   // Remove high-range emojis
            .replace(/[\u{2700}-\u{27BF}]/gu, '')     // Remove dingbats
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '')   // Remove emoticons
            .replace(/\s+/g, ' ')                     // Normalize spacing
            .trim();

        if (!cleanText) return;

        try {
            console.log('[Assistant] Generating Premium Speech...');
            setIsSpeaking(true);

            const response = await fetch('/api/assistant/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: cleanText, voice: 'nova' })
            });

            if (!response.ok) throw new Error('Failed to generate speech');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            // Use the persistent audio ref to avoid mobile blocks
            if (!audioRef.current) audioRef.current = new Audio();
            const audio = audioRef.current;
            audio.src = url;

            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(url);
            };

            audio.onerror = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(url);
            };

            await audio.play();
        } catch (error) {
            console.error('[Assistant] TTS Error:', error);
            setIsSpeaking(false);

            // Fallback to basic speech if premium fails
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
        }
    };

    const unlockAudio = () => {
        // A tiny silent WAV to "warm up" the audio context on mobile
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
        unlockAudio(); // Important for mobile voice
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
            "fixed z-50 flex flex-col items-end transition-all duration-300",
            isOpen ? "inset-0 md:inset-auto md:bottom-6 md:right-6" : "bottom-6 right-6"
        )}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={cn(
                            "shadow-2xl overflow-hidden bg-background flex flex-col",
                            "w-full h-full md:w-[350px] md:h-[500px] md:max-h-[80vh] md:rounded-2xl md:border md:border-border md:mb-4"
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">Tudo em Dia - Assistente</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Consultor Inteligente</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 rounded-full transition-colors",
                                        autoSpeak ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground"
                                    )}
                                    onClick={() => {
                                        const newValue = !autoSpeak;
                                        setAutoSpeak(newValue);
                                        if (newValue) unlockAudio(); // Unlock on toggle
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
                                    className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground"
                                    onClick={clearHistory}
                                    title="Limpar Histórico"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="w-4 h-4" />
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
                                            "flex flex-col max-w-[90%] rounded-2xl px-4 py-3 text-sm transition-all duration-200",
                                            m.role === 'user'
                                                ? "bg-emerald-600 text-white self-end rounded-tr-sm shadow-md"
                                                : "bg-muted/50 text-foreground self-start rounded-tl-sm border border-border/50"
                                        )}
                                    >
                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-snug prose-p:my-1">
                                            {m.parts.map((part, idx) => {
                                                if (part.type === 'text') {
                                                    // Remove any accidental ID leaks from the UI
                                                    const displayText = part.text?.replace(/\(ID:.*?\)/g, '') || '';
                                                    return <ReactMarkdown key={idx}>{displayText}</ReactMarkdown>;
                                                }

                                                if (part.type === 'tool-addTransaction') {
                                                    const res = part.output as AssistantUITools['addTransaction']['output'];
                                                    if (!res) return null;

                                                    return (
                                                        <div key={idx} className="mt-2 p-3 bg-background/50 rounded-xl border border-emerald-500/20 shadow-sm animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
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
                                                        <div key={idx} className="mt-2 p-3 bg-background/50 rounded-xl border border-emerald-500/20 shadow-sm animate-in fade-in duration-300">
                                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                                                                <Bot className="w-3 h-3" />
                                                                <span>Confirmação em Lote</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-medium leading-tight text-foreground/90">
                                                                    {res.message?.replace(/\(ID:.*?\)/g, '') || ''}
                                                                </p>

                                                                {res.action === 'requires_confirmation' && res.transactions && (
                                                                    <div className="mt-2 space-y-2 border-y border-emerald-500/10 py-2 max-h-[200px] overflow-y-auto">
                                                                        {res.transactions.map((tx: any, tIdx: number) => (
                                                                            <div key={tIdx} className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
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
                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                        <span className="text-xs text-muted-foreground animate-pulse font-medium underline underline-offset-4 decoration-emerald-500/30">Pensando...</span>
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
                                {/* Scroll Anchor */}
                                <div ref={messagesEndRef} className="h-px" />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
                            <form
                                onSubmit={handleSendMessage}
                                className="flex items-center gap-2"
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 shrink-0 rounded-xl transition-all duration-300",
                                        isListening
                                            ? "bg-red-500 text-white animate-pulse scale-110 shadow-lg shadow-red-500/20"
                                            : "hover:bg-emerald-500/10 text-emerald-600"
                                    )}
                                    onClick={toggleListening}
                                    disabled={isLoading}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </Button>
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isListening ? "Ouvindo..." : "Fale ou digite..."}
                                    className="flex-1 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200"
                                    disabled={isLoading || !input.trim()}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                            <div className="mt-2 text-center text-[9px] text-muted-foreground/60 font-medium uppercase tracking-tight">
                                Consultoria Inteligente Tudo Em Dia
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button */}
            {!isOpen && (
                <motion.button
                    id="ai-chat-trigger"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="relative group cursor-pointer"
                >
                    <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
                        {/* Robot Brain Animation Layer */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.1),transparent)] group-hover:bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent)] transition-all" />
                        <Bot className="w-8 h-8 text-white drop-shadow-md z-10" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center z-20">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        </div>
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
                /* Firefox */
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #10b981 rgba(0, 0, 0, 0.05);
                }
            `}</style>
        </div>
    );
}
