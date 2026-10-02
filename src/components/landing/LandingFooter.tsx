// src/components/landing/LandingFooter.tsx
import * as React from "react";
import { Link } from "react-router-dom";
import {
  Send,
  Mail,
  FileText,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";

const utpLogo = "/images/utplogo.png";
const fasieLogo = "/images/FASIElogo.SVG";

const LandingFooter: React.FC = () => (
  <footer className="relative bg-gray-900 text-gray-400 overflow-hidden">
    {/* Мягкое свечение на фоне */}
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
    </div>

    <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
        {/* ─── Колонка 1: Бренд ─────────────────────────── */}
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center text-white",
                "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600",
                "shadow-md shadow-blue-500/20",
                "transition-transform duration-300 group-hover:scale-105"
              )}
              aria-hidden="true"
            >
              <Sparkles size={16} />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">
              Deyla
            </span>
          </Link>

          <p className="text-sm leading-relaxed text-gray-400 max-w-[220px]">
            Порядок в планировании, задачах и целях — за минуту в день.
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Все системы работают
          </div>
        </div>

        {/* ─── Колонка 2: Продукт ───────────────────────── */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">
            Продукт
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link
                to="/features"
                className="group inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
              >
                Возможности
                <ArrowUpRight
                  size={12}
                  className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  aria-hidden="true"
                />
              </Link>
            </li>
            <li>
              <Link
                to="/pricing"
                className="group inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
              >
                Цены
                <ArrowUpRight
                  size={12}
                  className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  aria-hidden="true"
                />
              </Link>
            </li>
            <li>
              <a
                href="https://t.me/ProskladaiBot"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Send size={14} aria-hidden="true" />
                Телеграм-бот
              </a>
            </li>
          </ul>
        </div>

        {/* ─── Колонка 3: Поддержка ─────────────────────── */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">
            Поддержка
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href="mailto:mentrixlabs@yandex.ru"
                className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Mail size={14} aria-hidden="true" />
                Написать на почту
              </a>
            </li>
            <li>
              <a
                href="https://t.me/ProskladaiBot"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Send size={14} aria-hidden="true" />
                Написать в Telegram
              </a>
            </li>
          </ul>
        </div>

        {/* ─── Колонка 4: Юридическое ───────────────────── */}
        <div>
          <h4 className="text-white font-semibold text-sm uppercase tracking-widest mb-5">
            Юридическое
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link
                to="/terms-of-use"
                className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <FileText size={14} aria-hidden="true" />
                Условия использования
              </Link>
            </li>
            <li>
              <Link
                to="/personal-data-consent"
                className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <FileText size={14} aria-hidden="true" />
                Обработка персональных данных
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* ─── Копирайт ─────────────────────────────────────── */}
      <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Deyla. Все права защищены.
        </p>
        <p className="flex items-center gap-1.5 text-xs">
          Сделано с
          <span className="text-red-400" aria-label="любовью">
            ♥
          </span>
          для тех, кто ценит своё время
        </p>
      </div>
    </div>
  </footer>
);

export default LandingFooter;