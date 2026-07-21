import { useMutation } from '@apollo/client/react';
import { useRef, useState } from 'react';
import { MEDIA_ICON } from '../../lib/genealogy';
import { useI18n } from '../../lib/i18n';
import { LINK_MEDIA, UNLINK_MEDIA } from './operations';
import { ghostButton, Section } from './ui';

export interface MediaItem {
  id: string;
  type: string;
  filePath: string;
  mimeType: string;
  title?: string | null;
  links: { id: string; personId?: string | null }[];
}

const REFETCH = ['PersonDetail'];

// Media attached to a person: upload a file, then it is linked here.
export function MediaList({
  treeId,
  personId,
  media,
  isAdmin,
  onChange,
  onError,
}: {
  treeId: string;
  personId: string;
  media: MediaItem[];
  isAdmin: boolean;
  onChange(): void;
  onError(): void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [unlinkMedia] = useMutation(UNLINK_MEDIA, { refetchQueries: REFETCH });
  const [linkMedia] = useMutation(LINK_MEDIA, { refetchQueries: REFETCH });

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('treeId', treeId);
      form.append('title', file.name);
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const created = (await response.json()) as { id: string };
      await linkMedia({ variables: { input: { mediaId: created.id, personId } } });
      onChange();
    } catch {
      onError();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Section
      title={t('mediaLabel')}
      action={
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={ghostButton}
        >
          {uploading ? t('uploading') : `＋ ${t('uploadMedia')}`}
        </button>
      }
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = '';
        }}
      />
      {media.length === 0 ? (
        <p className="text-sm text-stone-400 dark:text-stone-500">
          {t('noMedia')}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {media.map((item) => {
            const link = item.links.find((l) => l.personId === personId);
            const isImage = item.type === 'IMAGE';
            return (
              <div
                key={item.id}
                className="flex items-center gap-2.5 rounded-xl bg-stone-50 p-2 text-sm dark:bg-stone-800/70"
              >
                {isImage ? (
                  <img
                    src={`/api/media/${item.id}/file`}
                    alt={item.title ?? ''}
                    className="size-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-lg dark:bg-stone-700">
                    {MEDIA_ICON[item.type] ?? '📎'}
                  </span>
                )}
                <a
                  href={`/api/media/${item.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-stone-700 hover:underline dark:text-stone-200"
                >
                  {item.title ?? item.filePath.split('/').pop()}
                </a>
                {link && isAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      void unlinkMedia({ variables: { id: link.id } })
                        .then(onChange)
                        .catch(onError)
                    }
                    className={ghostButton}
                  >
                    {t('unlink')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
