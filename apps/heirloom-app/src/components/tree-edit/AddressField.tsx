import { useRef, useState } from 'react';

interface Feature {
  properties: { label: string };
}

// Address input with autocompletion from the French national geocoder
// (data.geopf.fr, formerly api-adresse). Free, keyless, CORS-enabled.
export function AddressField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const query = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(() => {
      void fetch(
        `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(q)}&limit=5`,
      )
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data: { features?: Feature[] }) => {
          setSuggestions((data.features ?? []).map((f) => f.properties.label));
          setOpen(true);
        })
        .catch(() => setSuggestions([]));
    }, 300);
  };

  return (
    <div className="relative">
      <input
        value={value}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          query(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-stone-200 bg-white text-sm shadow-lg dark:border-stone-700 dark:bg-stone-900">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(s);
                  setSuggestions([]);
                  setOpen(false);
                }}
                className="block w-full truncate px-3 py-2 text-left text-stone-700 transition hover:bg-amber-50 dark:text-stone-200 dark:hover:bg-stone-800"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
