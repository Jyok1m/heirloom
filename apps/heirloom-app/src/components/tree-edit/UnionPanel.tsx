import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import type { UnionType } from '../../generated/graphql';
import { enumLabel, UNION_TYPES } from '../../lib/genealogy';
import { icons } from '../../lib/icons';
import { useI18n } from '../../lib/i18n';
import { useNotify } from '../../lib/notify';
import { EventList } from './EventList';
import {
  DELETE_UNION,
  REMOVE_CHILD,
  REMOVE_PARTNER,
  UNION_DETAIL,
  UPDATE_UNION,
} from './operations';
import { fieldClass, ghostButton, personName, Section } from './ui';

const REFETCH = ['UnionDetail', 'TreeCanvas', 'PersonDetail'];

// Relationships are built with the person panel's quick-relative buttons; this
// panel only edits the union itself (type, date, and corrections).
export function UnionPanel({
  unionId,
  sources,
  isAdmin,
  onError,
  onSelectPerson,
  onDeleted,
}: {
  unionId: string;
  sources: { id: string; title: string }[];
  isAdmin: boolean;
  onError(): void;
  onSelectPerson(id: string): void;
  onDeleted(): void;
}) {
  const { t, lang } = useI18n();
  const { confirm } = useNotify();
  const { data } = useQuery(UNION_DETAIL, { variables: { id: unionId } });
  const [updateUnion] = useMutation(UPDATE_UNION, { refetchQueries: REFETCH });
  const [deleteUnion] = useMutation(DELETE_UNION, { refetchQueries: REFETCH });
  const [removePartner] = useMutation(REMOVE_PARTNER, {
    refetchQueries: REFETCH,
  });
  const [removeChild] = useMutation(REMOVE_CHILD, { refetchQueries: REFETCH });

  const [notes, setNotes] = useState<string | null>(null);
  const union = data?.union;
  const fail = () => onError();

  if (!union) {
    return (
      <div className="grid h-24 place-items-center">
        <span className="size-6 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        <select
          aria-label={t('unionTypeL')}
          value={union.type}
          onChange={(e) =>
            void updateUnion({
              variables: {
                id: union.id,
                input: { type: e.target.value as UnionType },
              },
            }).catch(fail)
          }
          className={fieldClass}
        >
          {UNION_TYPES.map((value) => (
            <option key={value} value={value}>
              {enumLabel('unionType', value, lang)}
            </option>
          ))}
        </select>
        <textarea
          placeholder={t('notesL')}
          rows={2}
          value={notes ?? union.notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== null && notes !== (union.notes ?? '')) {
              void updateUnion({
                variables: { id: union.id, input: { notes: notes || null } },
              }).catch(fail);
            }
          }}
          className={fieldClass}
        />
      </div>

      <Section title={t('partnersLabel')}>
        <div className="flex flex-col gap-1.5">
          {union.partners.map((partner) => (
            <div
              key={partner.id}
              className="flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm dark:bg-stone-800"
            >
              <button
                type="button"
                onClick={() => onSelectPerson(partner.id)}
                className="min-w-0 flex-1 truncate text-left text-stone-700 hover:underline dark:text-stone-200"
              >
                {personName(partner)}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    void removePartner({
                      variables: { unionId: union.id, personId: partner.id },
                    }).catch(fail)
                  }
                  className={ghostButton}
                >
                  {t('removeFromUnion')}
                </button>
              )}
            </div>
          ))}
        </div>
      </Section>

      {union.children.length > 0 && (
        <Section title={t('childrenLabel')}>
          <div className="flex flex-col gap-1.5">
            {union.children.map((child) => (
              <div
                key={child.personId}
                className="flex items-center gap-2 rounded-lg bg-stone-50 px-2.5 py-1.5 text-sm dark:bg-stone-800/70"
              >
                <button
                  type="button"
                  onClick={() => onSelectPerson(child.personId)}
                  className="min-w-0 flex-1 truncate text-left text-stone-700 hover:underline dark:text-stone-200"
                >
                  <FontAwesomeIcon icon={icons.child} className="mr-1.5" />
                  {personName(child.person)}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      void removeChild({
                        variables: { unionId: union.id, personId: child.personId },
                      }).catch(fail)
                    }
                    className={ghostButton}
                  >
                    <FontAwesomeIcon icon={icons.xmark} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <EventList
        ownerType="union"
        ownerId={union.id}
        events={union.events as never}
        sources={sources}
        isAdmin={isAdmin}
        onChange={() => {}}
        onError={fail}
      />

      {isAdmin && (
        <button
          type="button"
          onClick={() => {
            void confirm(t('confirmDeleteUnion'), { danger: true }).then(
              (ok) => {
                if (ok) {
                  void deleteUnion({ variables: { id: union.id } })
                    .then(onDeleted)
                    .catch(fail);
                }
              },
            );
          }}
          className="mt-5 w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          {t('deleteUnionAction')}
        </button>
      )}
    </div>
  );
}
