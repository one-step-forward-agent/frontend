import type { Recommendation } from "../api/types";
import { Link } from "../router";
import { RichText } from "./RichText";
import { Icon } from "./icons";

/** Ссылка в чат, которая передаёт ассистенту саму рекомендацию как тему разговора. */
export function discussLink(item: Recommendation): string {
  return `/assistant?${new URLSearchParams({ topic: item.title, text: item.text })}`;
}

// Два цвета на все советы: обычный — синий, предупреждение (перенос, плотный день) — оранжевый
const tone = (item: Recommendation) => (item.kind === "warning" ? "warn" : "info");

/**
 * На экранах — только заголовки (до 4 слов): каждая строка открывает чат, где совет расписан подробно.
 * В самом чате (`full`) виден и текст.
 */
export function RecommendationList({
  items,
  label = "Dayla анализирует ваш день…",
  full = false,
  onDiscuss,
}: {
  items: Recommendation[] | undefined;
  label?: string;
  full?: boolean;
  /** В самом чате «Обсудить» открывает тему здесь же, а не переходом. */
  onDiscuss?: (index: number) => void;
}) {
  if (items === undefined) return <p className="muted small">{label}</p>;
  if (!items.length) return null;

  if (!full) {
    return (
      <ul className="recommendations-compact">
        {items.map((item) => (
          <li key={item.title}>
            <Link to={discussLink(item)} className={`recommendation-line rec-${tone(item)}`} title={item.text}>
              <i aria-hidden="true" className="rec-dot" />
              <span className="truncate">{item.title}</span>
              <Icon name="right" size={14} className="rec-arrow" />
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="recommendations-list">
      {items.map((item, index) => (
        <div key={item.title} className={`recommendation rec-${tone(item)}`}>
          <p>
            <strong>{item.title}.</strong> <RichText text={item.text} inline />
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
      ))}
    </div>
  );
}
