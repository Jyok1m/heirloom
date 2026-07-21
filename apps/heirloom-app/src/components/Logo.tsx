// Heirloom emblem: a family tree — a rooted trunk branching to three members.
// Uses currentColor so it inherits its color from the surrounding element.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20v-6" />
        <path d="M12 14 12 8" />
        <path d="M12 14 7 11.5" />
        <path d="M12 14 17 11.5" />
        <path d="M12 20l-2.4 2.4M12 20l2.4 2.4" />
      </g>
      <g fill="currentColor">
        <circle cx="12" cy="6.4" r="2.3" />
        <circle cx="6" cy="10.6" r="2.3" />
        <circle cx="18" cy="10.6" r="2.3" />
      </g>
    </svg>
  );
}
