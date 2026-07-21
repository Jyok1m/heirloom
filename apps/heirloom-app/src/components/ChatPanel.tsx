import { useEffect, useRef, useState } from 'react';
import { streamChat, type AssistantAction } from '../lib/assistant';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: AssistantAction[];
  error?: boolean;
}

const CONVERSATION_KEY = 'heirloom-conversation';

export function ChatPanel({ treeId }: { treeId?: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Logged-in users get their conversation history back
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(CONVERSATION_KEY);
    if (!saved) return;
    conversationId.current = saved;
    fetch(`/api/assistant/conversations/${saved}`, { credentials: 'include' })
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as {
              turns: { role: 'user' | 'assistant'; content: string }[];
            })
          : null,
      )
      .then((data) => {
        if (data?.turns.length) {
          setMessages(
            data.turns.map((turn) => ({
              role: turn.role,
              content: turn.content,
            })),
          );
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const message = input.trim();
    if (!message || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: 'user', content: message },
      { role: 'assistant', content: '', actions: [] },
    ]);

    const patchLast = (patch: (last: Message) => Message) =>
      setMessages((m) => [...m.slice(0, -1), patch(m[m.length - 1])]);

    try {
      await streamChat(
        { message, treeId, conversationId: conversationId.current },
        {
          onToken: (text) =>
            patchLast((last) => ({ ...last, content: last.content + text })),
          onTool: (action) =>
            patchLast((last) => ({
              ...last,
              actions: [...(last.actions ?? []), action],
            })),
          onDone: (result) => {
            conversationId.current = result.conversationId;
            if (user) {
              localStorage.setItem(CONVERSATION_KEY, result.conversationId);
            }
            patchLast((last) => ({
              ...last,
              content: result.reply || last.content,
            }));
          },
          onError: () =>
            patchLast((last) => ({
              ...last,
              content: t('errorGeneric'),
              error: true,
            })),
        },
      );
    } catch {
      patchLast((last) => ({ ...last, content: t('errorGeneric'), error: true }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label={t('chatTitle')}
      className="flex w-full flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-amber-900/10 ring-1 ring-amber-900/10 dark:bg-stone-900 dark:shadow-black/30 dark:ring-stone-700/60"
    >
      <div className="flex items-center gap-3 border-b border-amber-900/10 bg-linear-to-r from-amber-50 to-orange-50/60 px-5 py-3.5 dark:border-stone-800 dark:from-stone-900 dark:to-stone-900">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-amber-500 to-amber-700 text-base text-white shadow-sm">
          ✦
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            {t('chatTitle')}
          </p>
          <p className="truncate text-xs text-stone-500 dark:text-stone-400">
            {t('chatSubtitle')}
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex h-72 flex-col gap-3 overflow-y-auto bg-linear-to-b from-transparent to-amber-50/40 px-4 py-4 sm:h-80 sm:px-5 dark:to-stone-950/40"
      >
        {messages.length === 0 && (
          <p className="m-auto max-w-sm text-center text-sm leading-relaxed text-stone-400 dark:text-stone-500">
            {t('chatEmpty')}
          </p>
        )}
        {messages.map((message, i) =>
          message.role === 'user' ? (
            <div
              key={i}
              className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-linear-to-b from-amber-600 to-amber-700 px-4 py-2.5 text-sm text-white shadow-sm"
            >
              {message.content}
            </div>
          ) : (
            <div key={i} className="mr-auto max-w-[85%] space-y-1.5">
              {(message.actions?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1">
                  {message.actions!.map((action, j) => (
                    <span
                      key={j}
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    >
                      ⚙ {action.tool}
                    </span>
                  ))}
                </div>
              )}
              <div
                className={`whitespace-pre-wrap rounded-2xl rounded-bl-md px-4 py-2.5 text-sm shadow-sm ${
                  message.error
                    ? 'bg-red-50 text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900'
                    : 'bg-white text-stone-700 ring-1 ring-stone-200/80 dark:bg-stone-800 dark:text-stone-100 dark:ring-stone-700'
                }`}
              >
                {message.content || (
                  <span className="inline-flex items-center gap-1.5 text-stone-400 dark:text-stone-500">
                    <span className="size-1.5 animate-pulse rounded-full bg-current" />
                    {t('thinking')}
                  </span>
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <form
        className="border-t border-amber-900/10 p-3 sm:p-4 dark:border-stone-800"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl bg-stone-100/80 p-1.5 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-amber-400/60 dark:bg-stone-800 dark:focus-within:bg-stone-950 dark:focus-within:ring-amber-500/40">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={t('chatPlaceholder')}
            aria-label={t('chatPlaceholder')}
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label={t('send')}
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-b from-amber-600 to-amber-700 text-white shadow-sm transition hover:from-amber-500 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {busy ? (
              <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path d="M3.1 2.3a.75.75 0 0 0-1 .9l1.9 6.05a.75.75 0 0 0 .58.51l6.3 1.09c.28.05.28.45 0 .5l-6.3 1.1a.75.75 0 0 0-.58.5l-1.9 6.06a.75.75 0 0 0 1 .9l15.1-7.13a.75.75 0 0 0 0-1.35L3.1 2.3Z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-2 px-1 text-[11px] text-stone-400 dark:text-stone-600">
          {t('chatHint')}
        </p>
      </form>
    </section>
  );
}
