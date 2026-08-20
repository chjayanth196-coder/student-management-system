"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import type { AiReply, AiSuggestion } from "@/types";

interface ChatMessage extends AiReply {
  id: string;
}

export function JaiChat() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [listening, setListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[₹]/g, "rupees "));
    utterance.lang = "en-US";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Load suggestions on mount
  useEffect(() => {
    if (user) {
      apiClient
        .get<{ success: boolean; data: AiSuggestion[] }>("/ai/suggestions")
        .then((res) => setSuggestions(res.data.data || []))
        .catch(() => { /* suggestions are non-critical */ });
    }
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, loading]);

  // Greeting message when opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          text: `Hi${user?.name ? ", " + user.name : ""}! I am JAI, your ERP assistant and voice agent. Ask me about your attendance, fees, results, or how to use any module. You can also report a website issue here.`,
        },
      ]);
    }
  }, [open, messages.length, user?.name]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString() + "-u",
        role: "user",
        text: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const { data } = await apiClient.post<{ success: boolean; data: AiReply }>(
          "/ai/chat",
          { message: trimmed }
        );
        const reply: ChatMessage = {
          id: Date.now().toString() + "-a",
          role: "assistant",
          text: data.data.text,
          links: data.data.links,
          data: data.data.data,
        };
        setMessages((prev) => [...prev, reply]);
        if (speakEnabled) {
          speak(data.data.text);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-e",
            role: "assistant",
            text: "I had trouble reaching the server. Please try again in a moment.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, speakEnabled, speak]
  );

  // Speech-to-text
  const toggleListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  }, [listening]);

  const handleSuggestion = (msg: string) => {
    sendMessage(msg);
  };

  const handleLink = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Toggle JAI assistant"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-[60] flex h-[480px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold leading-tight">JAI Assistant</p>
                <p className="text-[11px] text-white/80">Chat &amp; Voice Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSpeakEnabled((s) => !s)}
                className="rounded p-1.5 hover:bg-white/20"
                title={speakEnabled ? "Mute voice" : "Enable voice"}
              >
                {speakEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1.5 hover:bg-white/20"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="flex flex-col gap-3 p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "self-end bg-primary text-primary-foreground"
                      : "self-start bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.links.map((link, i) => (
                        <button
                          key={i}
                          onClick={() => handleLink(link.href)}
                          className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 self-start rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> JAI is thinking...
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 border-t border-border px-3 py-2">
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(s.message)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border p-3">
            <button
              onClick={toggleListening}
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition ${
                listening
                  ? "bg-red-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
              title={listening ? "Stop listening" : "Speak to JAI"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask JAI anything..."
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="h-9 w-9 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
