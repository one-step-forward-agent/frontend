import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { tr } from "@/i18n";
import type { BlogPost } from "@/types/blog";

/** Shared by the landing page and the editor's card preview. */
export function BlogCard({ post, preview = false }: { post: BlogPost; preview?: boolean }) {
  const card = post.landing;
  const image = card?.image || post.coverImage;
  const title = card?.title || post.title;
  const caption = card?.caption || post.tags[0];
  const content = (
    <Card className="h-full p-0 overflow-hidden border-none shadow-lg bg-white dark:bg-gray-900 group-hover:-translate-y-1 transition-transform duration-300">
      <div className="h-48 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center relative overflow-hidden">
        {image && <img src={image} alt={card?.imageAlt || post.coverAlt || title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
        {caption && <span className="relative z-10 bg-white/90 dark:bg-gray-900/90 px-4 py-2 rounded-full text-sm text-purple-700 dark:text-purple-300">{caption}</span>}
      </div>
      <div className="p-6 break-words">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{card?.description || post.excerpt}</p>
        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium inline-flex items-center gap-1">
          {card?.linkText || tr("Читать статью", "Read article")} <ArrowRight size={14} />
        </span>
      </div>
    </Card>
  );
  return preview ? <div>{content}</div> : <Link to={`/blog/${post.slug}`} className="group block min-w-0">{content}</Link>;
}
