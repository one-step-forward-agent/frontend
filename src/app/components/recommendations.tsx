import type { Recommendation } from "../api/types";
import { Link } from "../router";
import { RichText } from "./RichText";
import { Badge } from "./ui";

/** Ссылка в чат, которая передаёт ассистенту саму рекомендацию как тему разговора. */
export function discussLink(item: Recommendation): string {
  return `/assistant?${new URLSearchParams({ topic: item.title, text: item.text })}`;
}

export function RecommendationList({
  items,
  label = "Dayla анализирует ваш день…",
  onDiscuss,
}: {
  items: Recommendation[] | undefined;
  label?: string;
  /** В самом чате «Обсудить» открывает тему здесь же, а не переходом. */
  onDiscuss?: (index: number) => void;
}) {
  return (
    <div className="recommendations-list">
      {items === undefined ? (
        <p className="muted">{label}</p>
      ) : (
        items.map((item, index) => (
          <div key={item.title} className="recommendation">
            <p>
              <Badge tone={item.kind === "warning" ? "warn" : item.kind === "success" ? "ok" : "accent"}>{item.title}</Badge> <RichText text={item.text} inline />
            </p>
            {onDiscuss ? (
              <button type="button" className="btn btn-ghost btn-sm" aria-label={`Обсудить: ${item.title}`} onClick={() => onDiscuss(index)}>
                Обсудить
              </button>
            ) : (
              <Link to={discussLink(item)} className="btn btn-ghost btn-sm" aria-label={`Обсудить: ${item.title}`}>
                Обсудить
              </Link>
            )}
          </div>
        ))
      )}
    </div>
  );
}
