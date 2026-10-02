import { useCallback, useEffect, useRef, useState } from "react";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";

function dataShort(iso) {
    try {
        return new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

export default function ChatDialog({ rispostaId, titolo, counterpart, senderRole }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get(`/risposte/${rispostaId}/messaggi`);
            setMessages(data);
        } catch {
            /* silenzioso: il poll riprova */
        }
    }, [rispostaId]);

    useEffect(() => {
        if (!open) return undefined;
        load();
        const t = setInterval(load, 4000);
        return () => clearInterval(t);
    }, [open, load]);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ block: "end" });
    }, [messages, open]);

    const send = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setSending(true);
        try {
            await api.post(`/risposte/${rispostaId}/messaggi`, { testo: text.trim() });
            setText("");
            load();
        } catch (err) {
            toast.error(formatApiError(err));
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" data-testid={`chat-open-${rispostaId}`}
                    className="rounded-full border-white/15 text-slate-200 hover:bg-white/10 hover:text-white">
                    <MessageCircle className="h-4 w-4 mr-1.5" /> Apri chat
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-navy-700 border-white/10 text-white sm:max-w-lg max-h-[85vh] flex flex-col" data-testid={`chat-dialog-${rispostaId}`}>
                <DialogHeader>
                    <DialogTitle className="font-display text-lg">Chat: {titolo}</DialogTitle>
                    <p className="text-xs text-slate-400 -mt-1">Stai parlando con {counterpart} · i messaggi restano nel preventivo</p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[45vh]" data-testid={`chat-messages-${rispostaId}`}>
                    {messages.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-8">
                            Nessun messaggio: scrivi il primo per coordinare tempi e dettagli.
                        </p>
                    )}
                    {messages.map((m) => {
                        const mine = m.sender_role === senderRole;
                        return (
                            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`} data-testid={`chat-message-${m.id}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? "bg-brand text-white rounded-br-sm" : "bg-navy/80 border border-white/10 text-slate-200 rounded-bl-sm"}`}>
                                    <p className="text-xs font-semibold opacity-80">{mine ? "Tu" : m.sender_name} · {dataShort(m.created_at)}</p>
                                    <p className="text-sm mt-1 leading-relaxed">{m.testo}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                <form onSubmit={send} className="flex gap-2 pt-3 border-t border-white/10" data-testid={`chat-form-${rispostaId}`}>
                    <Input value={text} onChange={(e) => setText(e.target.value)} data-testid={`chat-input-${rispostaId}`}
                        placeholder="Scrivi un messaggio…" maxLength={2000}
                        className="bg-navy/70 border-white/10 text-white placeholder:text-slate-500" />
                    <Button type="submit" disabled={sending || !text.trim()} data-testid={`chat-send-${rispostaId}`}
                        className="rounded-xl bg-brand hover:bg-brand-dark text-white shrink-0">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
