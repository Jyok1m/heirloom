import { App, Input } from 'antd';
import { useState } from 'react';
import { useI18n } from './i18n';

// Thin wrapper over antd's App context: toast messages + confirm modals,
// replacing window.alert / confirm / prompt across the app.
export function useNotify() {
  const { message, modal } = App.useApp();
  const { t } = useI18n();

  const confirm = (
    content: string,
    options: { danger?: boolean; title?: string } = {},
  ): Promise<boolean> =>
    new Promise((resolve) => {
      modal.confirm({
        title: options.title ?? content,
        content: options.title ? content : undefined,
        okText: options.danger ? t('deleteAction') : t('createAction'),
        cancelText: t('cancel'),
        okButtonProps: { danger: options.danger },
        centered: true,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  // Stronger confirmation for irreversible actions: the user must type an exact
  // word (e.g. "delete" / "supprimer") before the action goes through. Returning
  // a rejected promise from onOk keeps the modal open on a mismatch.
  const confirmType = (
    word: string,
    options: { danger?: boolean; title: string; okText?: string } = {
      title: '',
    },
  ): Promise<boolean> =>
    new Promise((resolve) => {
      const typed = { current: '' };
      modal.confirm({
        title: options.title,
        icon: null,
        content: (
          <TypeConfirm
            word={word}
            prompt={t('typeToConfirm')}
            promptAfter={t('typeToConfirmBelow')}
            onChange={(v) => (typed.current = v)}
          />
        ),
        okText: options.okText ?? (options.danger ? t('deleteAction') : t('createAction')),
        cancelText: t('cancel'),
        okButtonProps: { danger: options.danger },
        centered: true,
        onOk: () => {
          if (typed.current.trim().toLowerCase() !== word.trim().toLowerCase()) {
            void message.error(t('typeMismatch'));
            return Promise.reject(new Error('confirm-type mismatch'));
          }
          resolve(true);
          return undefined;
        },
        onCancel: () => resolve(false),
      });
    });

  return { message, modal, confirm, confirmType };
}

// Small controlled input rendered inside the confirm modal. It mirrors its
// value up through onChange (into a ref) so the modal's onOk can validate it.
function TypeConfirm({
  word,
  prompt,
  promptAfter,
  onChange,
}: {
  word: string;
  prompt: string;
  promptAfter: string;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <div>
      <p style={{ margin: '4px 0 10px' }}>
        {prompt} <strong>{word}</strong> {promptAfter}
      </p>
      <Input
        autoFocus
        value={value}
        placeholder={word}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
      />
    </div>
  );
}
