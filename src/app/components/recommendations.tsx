import type { Recommendation } from "../api/types";
import { Link } from "../router";
import { RichText } from "./RichText";
import { Icon } from "./icons";
import { tr } from "@/i18n";

/** Ссылка в чат: рекомендация становится темой и приходит расписанной подробно. */
export function discussLink(item: Recommendation): string {
  return `/assistant?${new URLSearchParams({ topic: item.title, text: item.text })}`;
}

const HOW_TO = tr("Подробнее", "More detail");

/**
 * На экранах — только заголовки (до 4 слов): каждая строка открывает чат, где совет расписан подробно.
 * В самом чате (`full`) виден и текст.
 */
export function RecommendationList({
  items,
  label = tr("Deyla анализирует ваш день…", "Deyla is analysing your day…"),
  full = false,
  onDiscuss,
}: {
  items: Recommendation[] | undefined;
  label?: string;
  full?: boolean;
  /** В самом чате «Подробнее» открывает тему здесь же, а не переходом. */
  onDiscuss?: (index: number) => void;
}) {
  if (items === undefined) return <p className="muted small">{label}</p>;
  if (!items.length) return null;

  if (!full) {
    return (
      <ul className="recommendations-compact">
        {items.map((item) => (
          <li key={item.title}>
            <Link to={discussLink(item)} className="recommendation-line" title={item.text}>
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
        <div key={item.title} className="recommendation">
          <p>
            <strong>{item.title}.</strong> <RichText text={item.text} inline />
          </p>
          {onDiscuss ? (
            <button type="button" className="btn btn-ghost btn-sm" aria-label={`${HOW_TO} ${item.title}`} onClick={() => onDiscuss(index)}>
              {HOW_TO}
            </button>
          ) : (
            <Link to={discussLink(item)} className="btn btn-ghost btn-sm" aria-label={`${HOW_TO} ${item.title}`}>
              {HOW_TO}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
