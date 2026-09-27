import React from "react";
import { Link } from "react-router-dom";

const MaskotImg = "/images/maskot.png";
const utpImg = "/images/utplogo.png";
const fasieSvg = "/images/FASIElogo.SVG";

const LandingFooter: React.FC = () => (
  <footer className="bg-gray-900 text-gray-400 py-12">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
        {/* Колонка 1: Бренд */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img
              src={MaskotImg}
              alt="Маскот"
              className="w-9 h-9 object-contain"
            />
            <span className="text-white text-2xl font-bold tracking-tight">
              Proskladai
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-300">
            Автоматизация SEO и инфографики для маркетплейсов.
          </p>
        </div>

        {/* Колонка 2: Поддержка (логотипы слева, текст справа) */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex flex-col gap-2 shrink-0">
            <img
              src={utpImg}
              alt="Университет"
              className="h-28 w-auto object-contain"
            />
            <img
              src={fasieSvg}
              alt="Фонд содействия инновациям"
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>

        {/* Колонка 3: Продукт */}
        <div>
          <h4 className="text-white font-bold text-base tracking-wide mb-4">
            Продукт
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link
                to="/features"
                className="hover:text-white transition-colors duration-200"
              >
                Возможности
              </Link>
            </li>
            <li>
              <Link
                to="/pricing"
                className="hover:text-white transition-colors duration-200"
              >
                Цены
              </Link>
            </li>
            <li>
              <a
                href="https://t.me/ProskladaiBot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-white transition-colors duration-200"
              >
                Телеграм-бот
              </a>
            </li>
          </ul>
        </div>

        {/* Колонка 4: Поддержка (контакты) + Юридическое */}
        <div>
          <h4 className="text-white font-bold text-base tracking-wide mb-4">
            Поддержка
          </h4>
          <ul className="space-y-3 text-sm mb-6">
            <li>
              <a
                href="mailto:your-email@example.com" // замените на реальный адрес
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-white transition-colors duration-200"
              >
                Написать на почту
              </a>
            </li>
          </ul>
          <h4 className="text-white font-bold text-base tracking-wide mb-4">
            Юридическое
          </h4>
          <ul className="space-y-3 text-sm">
            <li>
              <a
                href="/terms-of-use"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors duration-200"
              >
                Условия использования и Политика конфиденциальности
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Копирайт */}
      <div className="border-t border-gray-800 mt-10 pt-6 text-sm text-center text-gray-500">
        &copy; {new Date().getFullYear()} Proskladai. Все права защищены. Проект создан при поддержке Федерального государственного
        бюджетного учреждения "Фонд содействия развитию малых форм предприятий в научно-технической сфере" в рамках программы
        "Студенческий стартап" федерального проекта "Платформа университетского технологического предпринимательства".
      </div>
    </div>
  </footer>
);

export default LandingFooter;