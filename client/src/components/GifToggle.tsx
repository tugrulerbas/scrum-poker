import Icon from './Icon.tsx';

export default function GifToggle({ muted, onChange }: { muted: boolean; onChange: (muted: boolean) => void }) {
  const text = "GIF'leri gizle";
  return (
    <button
      type="button"
      className={`btn btn-ghost gif-toggle${muted ? ' is-on' : ''}`}
      aria-pressed={muted}
      title={text}
      onClick={() => onChange(!muted)}
    >
      <Icon name={muted ? 'image-off' : 'image'} size={20} />
      <span className="gif-toggle-text">{text}</span>
    </button>
  );
}
