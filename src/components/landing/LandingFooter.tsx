import * as React from "react";
import { Link } from "react-router-dom";
import { Send, Mail, FileText, ArrowUpRight, Sparkles } from "lucide-react";
import { telegramUrl, usePublicConfig } from "@/hooks/usePublicConfig";
import { cn } from "@/utils/cn";
import { tr } from "@/i18n";

const linkClass = "group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors";

const Arrow = () => (
  <ArrowUpRight
    size={12}
    className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
    aria-hidden="true"
  />
);

const LandingFooter: React.FC = () => {
  const config = usePublicConfig();
  const bot = telegramUrl(config);

  return (
    <footer className="relative bg-gray-900 text-gray-400 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center text-white",
                  "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600",
                  "shadow-md shadow-blue-500/20",
                  "transition-transform duration-300 group-hover:scale-105",
                )}
                aria-hidden="true"
              >
                <Sparkles size={16} />
              </div>
              <span className="text-white text-2xl font-bold tracking-tight">Dayla</span>
            </Link>


            {config?.online && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {tr("Все системы работают", "All systems operational")}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">{tr("Продукт", "Product")}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/#usecases" className={linkClass}>
                  {tr("Как это работает", "How it works")}
                  <Arrow />
                </a>
              </li>
              <li>
                <Link to="/app" className={linkClass}>
                  {tr("Открыть приложение", "Open the app")}
                  <Arrow />
                </Link>
              </li>
              {bot && (
                <li>
                  <a href={bot} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    <Send size={14} aria-hidden="true" />
                    {tr("Телеграм-бот", "Telegram bot")}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">{tr("Поддержка", "Support")}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:mentrixlabs@yandex.ru" className={linkClass}>
                  <Mail size={14} aria-hidden="true" />
                  {tr("Написать на почту", "Email us")}
                </a>
              </li>
              {bot && (
                <li>
                  <a href={bot} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    <Send size={14} aria-hidden="true" />
                    {tr("Написать в Telegram", "Message us on Telegram")}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">{tr("Юридическое", "Legal")}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/terms-of-use" className={linkClass}>
                  <FileText size={14} aria-hidden="true" />
                  {tr("Условия использования", "Terms of use")}
                </Link>
              </li>
              <li>
                <a href="/privacy-policy" className={linkClass}>
                  <FileText size={14} aria-hidden="true" />
                  {tr("Политика конфиденциальности", "Privacy policy")}
                </a>
              </li>
              <li>
                <Link to="/personal-data-consent" className={linkClass}>
                  <FileText size={14} aria-hidden="true" />
                  {tr("Обработка персональных данных", "Personal data processing")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Dayla. {tr("Все права защищены.", "All rights reserved.")}</p>
          <p className="flex items-center gap-1.5 text-xs">
            {tr("Сделано с", "Made with")}
            <span className="text-red-400" aria-label={tr("любовью", "love")}>
              ♥
            </span>
            {tr("для тех, кто ценит своё время", "for those who value their time")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
