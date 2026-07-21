import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import type { Pedigree, UnionType } from '../../generated/graphql';
import { enumLabel, PEDIGREES, UNION_TYPES } from '../../lib/genealogy';
import { icons } from '../../lib/icons';
import { useI18n } from '../../lib/i18n';
import { useNotify } from '../../lib/notify';
import { EventList } from './EventList';
import {
  ADD_CHILD,
  ADD_PARTNER,
  DELETE_UNION,
  REMOVE_CHILD,
  REMOVE_PARTNER,
  SET_PEDIGREE,
  UNION_DETAIL,
  UPDATE_UNION,
} from './operations';
import { fieldClass, ghostButton, personName, Section } from './ui';

interface NamedPerson {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
}

const REFETCH = ['UnionDetail', 'TreeCanvas', 'PersonDetail'];

export function UnionPanel({
  unionId,
  others,
  sources,
  isAdmin,
  onError,
  onSelectPerson,
  onDeleted,
}: {
  unionId: string;
  others: NamedPerson[];
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
  const [addPartner] = useMutation(ADD_PARTNER, { refetchQueries: REFETCH });
  const [removePartner] = useMutation(REMOVE_PARTNER, {
    refetchQueries: REFETCH,
  });
  const [addChild] = useMutation(ADD_CHILD, { refetchQueries: REFETCH });
  const [removeChild] = useMutation(REMOVE_CHILD, { refetchQueries: REFETCH });
  const [setPedigree] = useMutation(SET_PEDIGREE, { refetchQueries: REFETCH });

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

  const partnerIds = new Set(union.partners.map((p) => p.id));
  const childIds = new Set(union.children.map((c) => c.personId));

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
        {union.partners.length < 2 && (
          <select
            aria-label={t('addPartner')}
            value=""
            className="mt-1.5 w-full rounded-lg border border-dashed border-stone-300 bg-transparent px-2 py-1.5 text-sm text-stone-500 dark:border-stone-600"
            onChange={(e) => {
              if (!e.target.value) return;
              void addPartner({
                variables: { unionId: union.id, personId: e.target.value },
              }).catch(fail);
            }}
          >
            <option value="">{t('addPartner')}</option>
            {others
              .filter((p) => !partnerIds.has(p.id) && !childIds.has(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {personName(p)}
                </option>
              ))}
          </select>
        )}
      </Section>

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
              <select
                aria-label={t('pedigreeL')}
                value={child.pedigree}
                onChange={(e) =>
                  void setPedigree({
                    variables: {
                      unionId: union.id,
                      personId: child.personId,
                      pedigree: e.target.value as Pedigree,
                    },
                  }).catch(fail)
                }
                className="rounded-md border border-stone-200 bg-transparent px-1 py-0.5 text-xs dark:border-stone-600"
              >
                {PEDIGREES.map((value) => (
                  <option key={value} value={value}>
                    {enumLabel('pedigree', value, lang)}
                  </option>
                ))}
              </select>
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
        <select
          aria-label={t('addChild')}
          value=""
          className="mt-1.5 w-full rounded-lg border border-dashed border-stone-300 bg-transparent px-2 py-1.5 text-sm text-stone-500 dark:border-stone-600"
          onChange={(e) => {
            if (!e.target.value) return;
            void addChild({
              variables: {
                input: { unionId: union.id, personId: e.target.value },
              },
            }).catch(fail);
          }}
        >
          <option value="">{t('addChild')}</option>
          {others
            .filter((p) => !partnerIds.has(p.id) && !childIds.has(p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {personName(p)}
              </option>
            ))}
        </select>
      </Section>

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
