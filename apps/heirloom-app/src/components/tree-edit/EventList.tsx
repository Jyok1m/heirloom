import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import {
  enumLabel,
  gedcomToSortIso,
  isoToGedcom,
  PERSON_EVENT_TYPES,
  UNION_EVENT_TYPES,
} from '../../lib/genealogy';
import { EVENT_ICON, icons } from '../../lib/icons';
import { useI18n } from '../../lib/i18n';
import { useNotify } from '../../lib/notify';
import {
  CREATE_CITATION,
  CREATE_EVENT,
  DELETE_CITATION,
  DELETE_EVENT,
  UPDATE_EVENT,
} from './operations';
import type { CreateEventInput, UpdateEventInput } from '../../generated/graphql';
import { Chip, fieldClass, ghostButton, Section, smallButton } from './ui';

interface Citation {
  id: string;
  page?: string | null;
  quality?: number | null;
  source: { id: string; title: string };
}
export interface EventItem {
  id: string;
  type: string;
  description?: string | null;
  dateValue?: string | null;
  dateSort?: unknown;
  place?: string | null;
  notes?: string | null;
  citations?: Citation[];
}
interface SourceItem {
  id: string;
  title: string;
}
// Read-only events borrowed from elsewhere (a person's union events shown on
// their own life timeline). Clicking opens the owner for editing.
export interface ExtraEvent {
  id: string;
  type: string;
  dateValue?: string | null;
  dateSort?: unknown;
  context?: string;
  onOpen?: () => void;
}

const sortKey = (ev: { dateSort?: unknown }) =>
  typeof ev.dateSort === 'string' ? ev.dateSort : '￿';

const REFETCH = ['PersonDetail', 'UnionDetail', 'TreeCanvas'];

function EventForm({
  ownerType,
  initial,
  onSubmit,
  onCancel,
  busy,
}: {
  ownerType: 'person' | 'union';
  initial?: Partial<EventItem>;
  onSubmit(values: Record<string, unknown>): void;
  onCancel(): void;
  busy: boolean;
}) {
  const { t, lang } = useI18n();
  const types = ownerType === 'person' ? PERSON_EVENT_TYPES : UNION_EVENT_TYPES;
  const [type, setType] = useState(initial?.type ?? types[0]);
  // Calendar-driven date. Picking a day fills the GEDCOM value automatically;
  // the optional text field then allows an approximate date ("ABT 1850").
  const [date, setDate] = useState(
    typeof initial?.dateSort === 'string' ? initial.dateSort.slice(0, 10) : '',
  );
  const [dateValue, setDateValue] = useState(initial?.dateValue ?? '');
  const [place, setPlace] = useState(initial?.place ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  return (
    <form
      className="flex flex-col gap-2 rounded-xl bg-amber-50/60 p-3 dark:bg-stone-800/60"
      onSubmit={(event) => {
        event.preventDefault();
        // The calendar day is authoritative only while the GEDCOM value is an
        // exact date (or empty). Once it's approximate ("ABT 1850") — including
        // a stale day pre-filled when editing — derive the sort key from the
        // text so re-editing the approximation reorders the event correctly.
        const exactDate = /^\d{1,2} [A-Z]{3} \d{4}$/.test(dateValue);
        onSubmit({
          type,
          dateValue: dateValue || null,
          dateSort:
            date && (exactDate || !dateValue)
              ? new Date(date).toISOString()
              : dateValue
                ? gedcomToSortIso(dateValue)
                : null,
          place: place || null,
          description: description || null,
        });
      }}
    >
      <select
        aria-label={t('eventTypeL')}
        value={type}
        onChange={(e) => setType(e.target.value)}
        className={fieldClass}
      >
        {types.map((value) => (
          <option key={value} value={value}>
            {enumLabel('eventType', value, lang)}
          </option>
        ))}
      </select>
      {type === 'OTHER' && (
        <input
          required
          placeholder={t('descriptionL')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldClass}
        />
      )}
      <input
        type="date"
        aria-label={t('dateL')}
        value={date}
        onChange={(e) => {
          const value = e.target.value;
          setDate(value);
          // Auto-fill the GEDCOM date from the picked day
          if (value) setDateValue(isoToGedcom(value) ?? '');
        }}
        className={fieldClass}
      />
      <input
        placeholder={t('dateApproxL')}
        value={dateValue}
        onChange={(e) => setDateValue(e.target.value)}
        className={fieldClass}
      />
      <input
        placeholder={t('placeL')}
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        className={fieldClass}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={smallButton}>
          {busy ? t('submitting') : t('save')}
        </button>
        <button type="button" onClick={onCancel} className={ghostButton}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

function Citations({
  event,
  sources,
  isAdmin,
  onChange,
  onError,
}: {
  event: EventItem;
  sources: SourceItem[];
  isAdmin: boolean;
  onChange(): void;
  onError(): void;
}) {
  const { t } = useI18n();
  const [createCitation] = useMutation(CREATE_CITATION, {
    refetchQueries: REFETCH,
  });
  const [deleteCitation] = useMutation(DELETE_CITATION, {
    refetchQueries: REFETCH,
  });

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {(event.citations ?? []).map((citation) => (
        <Chip
          key={citation.id}
          onRemove={
            isAdmin
              ? () =>
                  void deleteCitation({ variables: { id: citation.id } })
                    .then(onChange)
                    .catch(onError)
              : undefined
          }
        >
          <FontAwesomeIcon icon={icons.book} className="mr-1" />
          {citation.source.title}
          {citation.page ? ` · ${citation.page}` : ''}
        </Chip>
      ))}
      {sources.length > 0 && (
        <select
          aria-label={t('addCitation')}
          value=""
          className="rounded-full border border-dashed border-stone-300 bg-transparent px-2 py-1 text-xs text-stone-500 dark:border-stone-600"
          onChange={(e) => {
            if (!e.target.value) return;
            void createCitation({
              variables: { input: { eventId: event.id, sourceId: e.target.value } },
            })
              .then(onChange)
              .catch(onError);
          }}
        >
          <option value="">＋ {t('addCitation')}</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.title}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function EventList({
  ownerType,
  ownerId,
  events,
  extraEvents,
  sources,
  isAdmin,
  onChange,
  onError,
}: {
  ownerType: 'person' | 'union';
  ownerId: string;
  events: EventItem[];
  extraEvents?: ExtraEvent[];
  sources: SourceItem[];
  isAdmin: boolean;
  onChange(): void;
  onError(): void;
}) {
  const { t, lang } = useI18n();
  const { confirm } = useNotify();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createEvent, createState] = useMutation(CREATE_EVENT, {
    refetchQueries: REFETCH,
  });
  const [updateEvent, updateState] = useMutation(UPDATE_EVENT, {
    refetchQueries: REFETCH,
  });
  const [deleteEvent] = useMutation(DELETE_EVENT, { refetchQueries: REFETCH });

  const ownerKey = ownerType === 'person' ? 'personId' : 'unionId';

  // Own (editable) events merged chronologically with borrowed union events.
  const rows: (
    | { kind: 'own'; ev: EventItem }
    | { kind: 'extra'; ev: ExtraEvent }
  )[] = [
    ...events.map((ev) => ({ kind: 'own' as const, ev })),
    ...(extraEvents ?? []).map((ev) => ({ kind: 'extra' as const, ev })),
  ].sort((a, b) => sortKey(a.ev).localeCompare(sortKey(b.ev)));

  return (
    <Section
      title={ownerType === 'person' ? t('eventsLabel') : t('unionEventsLabel')}
      action={
        !adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setEditingId(null);
            }}
            className={ghostButton}
          >
            <FontAwesomeIcon icon={icons.plus} className="mr-1" />
            {t('addEvent')}
          </button>
        )
      }
    >
      {adding && (
        <div className="mb-2">
          <EventForm
            ownerType={ownerType}
            busy={createState.loading}
            onCancel={() => setAdding(false)}
            onSubmit={(values) =>
              void createEvent({
                variables: {
                  input: {
                    [ownerKey]: ownerId,
                    ...values,
                  } as unknown as CreateEventInput,
                },
              })
                .then(() => {
                  setAdding(false);
                  onChange();
                })
                .catch(onError)
            }
          />
        </div>
      )}

      {rows.length === 0 && !adding && (
        <p className="text-sm text-stone-400 dark:text-stone-500">
          {t('noEvents')}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          if (row.kind === 'extra') {
            const ev = row.ev;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={ev.onOpen}
                className="rounded-xl bg-amber-50/70 p-2.5 text-left text-sm transition hover:bg-amber-100/70 dark:bg-stone-800/50 dark:hover:bg-stone-800"
              >
                <span className="font-medium text-stone-800 dark:text-stone-100">
                  <FontAwesomeIcon
                    icon={EVENT_ICON[ev.type] ?? icons.ring}
                    className="mr-1.5"
                  />{' '}
                  {enumLabel('eventType', ev.type, lang)}
                </span>
                {(ev.context || ev.dateValue) && (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {[ev.context, ev.dateValue].filter(Boolean).join(' · ')}
                  </p>
                )}
              </button>
            );
          }
          const event = row.ev;
          return editingId === event.id ? (
            <EventForm
              key={event.id}
              ownerType={ownerType}
              initial={event}
              busy={updateState.loading}
              onCancel={() => setEditingId(null)}
              onSubmit={(values) => {
                // owner fields are immutable; strip them
                void updateEvent({
                  variables: {
                    id: event.id,
                    input: values as unknown as UpdateEventInput,
                  },
                })
                  .then(() => {
                    setEditingId(null);
                    onChange();
                  })
                  .catch(onError);
              }}
            />
          ) : (
            <div
              key={event.id}
              className="rounded-xl bg-stone-50 p-2.5 text-sm dark:bg-stone-800/70"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-medium text-stone-800 dark:text-stone-100">
                    <FontAwesomeIcon
                      icon={EVENT_ICON[event.type] ?? icons.star}
                      className="mr-1.5"
                    />{' '}
                    {event.type === 'OTHER' && event.description
                      ? event.description
                      : enumLabel('eventType', event.type, lang)}
                  </span>
                  {(event.dateValue || event.place) && (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {[event.dateValue, event.place]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(event.id);
                      setAdding(false);
                    }}
                    className={ghostButton}
                  >
                    <FontAwesomeIcon icon={icons.pen} />
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        void confirm(t('confirmDeleteEvent'), {
                          danger: true,
                        }).then((ok) => {
                          if (ok) {
                            void deleteEvent({ variables: { id: event.id } })
                              .then(onChange)
                              .catch(onError);
                          }
                        });
                      }}
                      className={ghostButton}
                    >
                      <FontAwesomeIcon icon={icons.trash} />
                    </button>
                  )}
                </div>
              </div>
              <Citations
                event={event}
                sources={sources}
                isAdmin={isAdmin}
                onChange={onChange}
                onError={onError}
              />
            </div>
          );
        })}
      </div>
    </Section>
  );
}
