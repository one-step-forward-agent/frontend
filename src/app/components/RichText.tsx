import Markdown, { type Components } from "react-markdown";

// Ответы модели иногда приходят в markdown (**жирный**, списки, ### заголовки): показываем его оформленным.
// Сырой HTML не включён (нет rehype-raw), поэтому текст модели не может вставить разметку на страницу.
const BLOCK: Components = {
  h1: ({ children }) => <p className="rich-heading">{children}</p>,
  h2: ({ children }) => <p className="rich-heading">{children}</p>,
  h3: ({ children }) => <p className="rich-heading">{children}</p>,
  h4: ({ children }) => <p className="rich-heading">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
  img: () => null,
};

// В строке (рекомендация рядом с бейджем) абзацы не должны переносить текст
const INLINE: Components = { ...BLOCK, p: ({ children }) => <>{children} </> };

export function RichText({ text, inline = false }: { text: string; inline?: boolean }) {
  if (inline) {
    return (
      <span className="rich-text">
        <Markdown components={INLINE} allowedElements={["p", "strong", "em", "code", "a", "del"]} unwrapDisallowed>
          {text}
        </Markdown>
      </span>
    );
  }
  return (
    <div className="rich-text">
      <Markdown components={BLOCK}>{text}</Markdown>
    </div>
  );
}
