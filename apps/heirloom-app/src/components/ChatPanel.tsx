import { useEffect, useRef, useState } from 'react';
import { streamChat, type AssistantAction } from '../lib/assistant';
import { useI18n } from '../lib/i18n';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: AssistantAction[];
  error?: boolean;
}

export function ChatPanel() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        { message, conversationId: conversationId.current },
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
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="border-b border-stone-100 px-4 py-3 text-sm font-medium text-stone-500 sm:px-5 dark:border-stone-800 dark:text-stone-400">
        {t('chatTitle')}
      </div>

      <div
        ref={scrollRef}
        className="flex h-72 flex-col gap-3 overflow-y-auto px-4 py-4 sm:h-80 sm:px-5"
      >
        {messages.length === 0 && (
          <p className="m-auto max-w-sm text-center text-sm text-stone-400 dark:text-stone-500">
            {t('chatEmpty')}
          </p>
        )}
        {messages.map((message, i) =>
          message.role === 'user' ? (
            <div
              key={i}
              className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-stone-900 px-4 py-2.5 text-sm text-stone-50 dark:bg-stone-100 dark:text-stone-900"
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
                      className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                    >
                      ⚙ {action.tool}
                    </span>
                  ))}
                </div>
              )}
              <div
                className={`whitespace-pre-wrap rounded-2xl rounded-bl-md border px-4 py-2.5 text-sm ${
                  message.error
                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
                    : 'border-stone-200 bg-stone-50 text-stone-800 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100'
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
        className="flex items-end gap-2 border-t border-stone-100 p-3 sm:p-4 dark:border-stone-800"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
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
          className="max-h-32 min-h-10 flex-1 resize-y rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-600"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? t('thinking') : t('send')}
        </button>
      </form>
      <p className="px-4 pb-3 text-[11px] text-stone-400 sm:px-5 dark:text-stone-600">
        {t('chatHint')}
      </p>
    </section>
  );
}
