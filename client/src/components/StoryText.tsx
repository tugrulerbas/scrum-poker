const isHttp = (s: string) => /^https?:\/\/\S+$/i.test(s);

/** Açıklama yalnızca http(s) ile başlayan tek bir link ise bağlantı olarak gösterilir. */
export default function StoryDescription({ text }: { text: string }) {
  if (!text) return null;
  if (isHttp(text))
    return (
      <a className="story-link" href={text} target="_blank" rel="noopener noreferrer">
        {text}
      </a>
    );
  return <p className="story-desc">{text}</p>;
}
