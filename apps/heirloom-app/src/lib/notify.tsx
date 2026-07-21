import { App } from 'antd';
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

  return { message, modal, confirm };
}
