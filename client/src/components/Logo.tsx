export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <a
      className="logo"
      aria-label="Mimeda Scrum Poker ana sayfa"
      href="/"
      onClick={(e) => {
        if (!onClick) return;
        e.preventDefault();
        onClick();
      }}
    >
      <img className="logo-mark" src="/mimeda-mark.png" width="32" height="32" alt="" />
      <span className="logo-text">
        <b>Mimeda</b> <span>Scrum Poker</span>
      </span>
    </a>
  );
}
