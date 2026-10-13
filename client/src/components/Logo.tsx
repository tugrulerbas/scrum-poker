export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <a
      className="logo"
      href="/"
      onClick={(e) => {
        if (!onClick) return;
        e.preventDefault();
        onClick();
      }}
    >
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 2.5c-3.6 4-8 6.6-8 10.6A4.3 4.3 0 0 0 11 16.4c-.3 2-1.2 3.4-2.8 4.6h7.6c-1.6-1.2-2.5-2.6-2.8-4.6a4.3 4.3 0 0 0 7-3.3c0-4-4.4-6.6-8-10.6z" />
        </svg>
      </span>
      <span className="logo-text">Scrum Poker</span>
    </a>
  );
}
