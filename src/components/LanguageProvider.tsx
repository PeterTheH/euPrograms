"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "bg";

type Dictionary = Record<string, string>;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  label: (value: string) => string;
};

const translations: Record<Locale, Dictionary> = {
  en: {
    "nav.programs": "Programs",
    "nav.eligibility": "Eligibility",
    "nav.documents": "Documents",
    "nav.saved": "Saved",
    "nav.sources": "Sources",
    "language.toggle": "BG",
    "language.label": "Language",
    "home.eyebrow": "EU and Bulgarian startup funding",
    "home.title": "Find the right programme, check fit, and generate a focused application pack.",
    "home.stats.open": "open or rolling",
    "home.stats.bg": "Bulgarian routes",
    "home.stats.eu": "EU routes",
    "filters.title": "Filters",
    "filters.reset": "Reset",
    "filters.region": "Region",
    "filters.funding": "Funding",
    "filters.sector": "Sector",
    "filters.stage": "Stage",
    "filters.status": "Status",
    "filters.deadlineSoon": "Deadline soon",
    "filters.highFunding": "High funding amount",
    "common.all": "All",
    "common.search": "Search",
    "common.programmes": "programmes",
    "common.funding": "Funding",
    "common.deadline": "Deadline",
    "common.difficulty": "Difficulty",
    "common.provider": "Provider",
    "common.stage": "Stage",
    "common.details": "Details",
    "common.checkFit": "Check fit",
    "common.save": "Save",
    "common.saved": "Saved",
    "common.unsave": "Unsave",
    "common.officialSource": "Official source",
    "detail.back": "Back to programs",
    "detail.generatePack": "Generate application pack",
    "detail.facts": "Programme facts",
    "detail.canApply": "Who can apply",
    "detail.cannotApply": "Who cannot apply",
    "detail.eligibleCosts": "Eligible costs",
    "detail.requiredDocs": "Required documents",
    "detail.selectionCriteria": "Selection criteria",
    "detail.applicationFocus": "Application focus",
    "detail.tips": "Application tips",
    "detail.tipsHeading": "What evaluators are likely looking for",
    "detail.similar": "Similar programmes",
    "detail.related": "Related routes",
    "checker.eyebrow": "Eligibility checker",
    "checker.title": "Check fit before drafting documents.",
    "documents.eyebrow": "Generated documents",
    "documents.title": "Build a programme-specific application pack.",
    "saved.eyebrow": "Saved programmes",
    "saved.title": "Your shortlist.",
    "saved.empty": "No saved programmes yet.",
    "sources.eyebrow": "Source monitoring",
    "sources.title": "Official-source collection status.",
    "form.programme": "Programme",
    "form.companyCountry": "Company country",
    "form.sme": "SME status",
    "form.sector": "Sector",
    "form.productStage": "Product stage",
    "form.revenue": "Revenue",
    "form.prototype": "Prototype",
    "form.ip": "IP position",
    "form.fundingNeed": "Funding need",
    "form.applicationMode": "Application mode",
    "form.previousEuFunding": "Previous EU funding",
    "form.projectType": "Project type",
    "form.projectDescription": "Project description (optional, improves AI quality)",
    "form.projectDescriptionHint": "Describe your project: the problem, your solution, traction, and key numbers. The more specific, the better the AI drafts and feedback.",
    "form.select": "Select",
    "form.checking": "Checking...",
    "form.checkEligibility": "Check eligibility",
    "form.generating": "Generating...",
    "form.packLockedNoCheck": "Run the eligibility check to unlock the application pack.",
    "result.fit": "fit",
    "result.why": "Why",
    "result.risks": "Risks",
    "result.missing": "Missing",
    "result.nextSteps": "Next steps",
    "pack.ollama": "Ollama generated",
    "pack.fallback": "Local fallback",
    "pack.eyebrow": "Programme-tailored pack",
    "pack.eligibilityWarning": "Our eligibility check flagged this programme as a likely poor fit. Review the risks above before investing time in this application.",
    "pack.titleSuffix": "application pack",
    "pack.tips": "Application tips",
    "pack.checklist": "Supporting document checklist",
    "pack.download": "Download / Print",
    "section.answerPlaceholder": "Write your answer for this section here...",
    "section.draft": "Draft a starting point",
    "section.drafting": "Drafting...",
    "section.feedback": "Get AI feedback",
    "section.reviewing": "Reviewing...",
    "section.strengths": "Strengths",
    "section.gaps": "What to improve",
    "section.rewrite": "Suggested rewrite",
    "section.useRewrite": "Use this rewrite",
    "sources.refresh": "Refresh sources",
    "sources.refreshing": "Refreshing...",
    "sources.complete": "Refresh complete.",
    "sources.failed": "Source refresh failed.",
    "sources.source": "Source",
    "sources.status": "Status",
    "sources.lastChecked": "Last checked",
    "sources.new": "New",
    "sources.method": "Method",
    "sources.notes": "Notes"
  },
  bg: {
    "nav.programs": "Програми",
    "nav.eligibility": "Допустимост",
    "nav.documents": "Документи",
    "nav.saved": "Запазени",
    "nav.sources": "Източници",
    "language.toggle": "EN",
    "language.label": "Език",
    "home.eyebrow": "Европейско и българско финансиране за стартъпи",
    "home.title": "Намерете подходяща програма, проверете допустимост и генерирайте фокусиран пакет за кандидатстване.",
    "home.stats.open": "отворени или постоянни",
    "home.stats.bg": "български възможности",
    "home.stats.eu": "европейски възможности",
    "filters.title": "Филтри",
    "filters.reset": "Изчисти",
    "filters.region": "Регион",
    "filters.funding": "Финансиране",
    "filters.sector": "Сектор",
    "filters.stage": "Етап",
    "filters.status": "Статус",
    "filters.deadlineSoon": "Краен срок скоро",
    "filters.highFunding": "Висока сума",
    "common.all": "Всички",
    "common.search": "Търсене",
    "common.programmes": "програми",
    "common.funding": "Финансиране",
    "common.deadline": "Краен срок",
    "common.difficulty": "Трудност",
    "common.provider": "Организация",
    "common.stage": "Етап",
    "common.details": "Детайли",
    "common.checkFit": "Провери",
    "common.save": "Запази",
    "common.saved": "Запазено",
    "common.unsave": "Премахни",
    "common.officialSource": "Официален източник",
    "detail.back": "Назад към програмите",
    "detail.generatePack": "Генерирай пакет",
    "detail.facts": "Данни за програмата",
    "detail.canApply": "Кой може да кандидатства",
    "detail.cannotApply": "Кой не може да кандидатства",
    "detail.eligibleCosts": "Допустими разходи",
    "detail.requiredDocs": "Необходими документи",
    "detail.selectionCriteria": "Критерии за оценка",
    "detail.applicationFocus": "Фокус на кандидатурата",
    "detail.tips": "Съвети",
    "detail.tipsHeading": "Какво вероятно търсят оценителите",
    "detail.similar": "Подобни програми",
    "detail.related": "Свързани възможности",
    "checker.eyebrow": "Проверка на допустимост",
    "checker.title": "Проверете съответствието преди подготовка на документи.",
    "documents.eyebrow": "Генерирани документи",
    "documents.title": "Създайте пакет за кандидатстване според конкретната програма.",
    "saved.eyebrow": "Запазени програми",
    "saved.title": "Вашият кратък списък.",
    "saved.empty": "Все още няма запазени програми.",
    "sources.eyebrow": "Мониторинг на източници",
    "sources.title": "Състояние на събирането от официални източници.",
    "form.programme": "Програма",
    "form.companyCountry": "Държава на компанията",
    "form.sme": "Статус МСП",
    "form.sector": "Сектор",
    "form.productStage": "Етап на продукта",
    "form.revenue": "Приходи",
    "form.prototype": "Прототип",
    "form.ip": "Интелектуална собственост",
    "form.fundingNeed": "Нужда от финансиране",
    "form.applicationMode": "Начин на кандидатстване",
    "form.previousEuFunding": "Предишно ЕС финансиране",
    "form.projectType": "Тип проект",
    "form.projectDescription": "Описание на проекта (по избор, подобрява качеството на ИИ)",
    "form.projectDescriptionHint": "Опишете проекта: проблема, вашето решение, постиженията и ключовите числа. Колкото по-конкретно, толкова по-добри са черновата и обратната връзка от ИИ.",
    "form.select": "Изберете",
    "form.checking": "Проверка...",
    "form.checkEligibility": "Провери допустимост",
    "form.generating": "Генериране...",
    "form.packLockedNoCheck": "Направете проверка на допустимостта, за да отключите пакета за кандидатстване.",
    "result.fit": "съвпадение",
    "result.why": "Причини",
    "result.risks": "Рискове",
    "result.missing": "Липсва",
    "result.nextSteps": "Следващи стъпки",
    "pack.ollama": "Генерирано с Ollama",
    "pack.fallback": "Локален шаблон",
    "pack.eyebrow": "Пакет по програмата",
    "pack.eligibilityWarning": "Нашата проверка отбеляза тази програма като вероятно неподходяща. Прегледайте рисковете по-горе, преди да инвестирате време в тази кандидатура.",
    "pack.titleSuffix": "пакет за кандидатстване",
    "pack.tips": "Съвети за кандидатстване",
    "pack.checklist": "Списък с подкрепящи документи",
    "pack.download": "Изтегли / Принтирай",
    "section.answerPlaceholder": "Напишете отговора си за този раздел тук...",
    "section.draft": "Генерирай чернова",
    "section.drafting": "Генериране...",
    "section.feedback": "Обратна връзка от ИИ",
    "section.reviewing": "Анализиране...",
    "section.strengths": "Силни страни",
    "section.gaps": "За подобрение",
    "section.rewrite": "Предложено пренаписване",
    "section.useRewrite": "Използвай това",
    "sources.refresh": "Обнови източниците",
    "sources.refreshing": "Обновяване...",
    "sources.complete": "Обновяването завърши.",
    "sources.failed": "Обновяването не успя.",
    "sources.source": "Източник",
    "sources.status": "Статус",
    "sources.lastChecked": "Последна проверка",
    "sources.new": "Нови",
    "sources.method": "Метод",
    "sources.notes": "Бележки"
  }
};

const valueLabels: Record<Locale, Record<string, string>> = {
  en: {
    open: "Open",
    upcoming: "Upcoming",
    closed: "Closed",
    rolling: "Rolling",
    ok: "OK",
    failed: "Failed",
    seeded: "Seeded",
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    none: "None",
    some: "Some",
    growth: "Growth",
    grant: "Grant",
    equity: "Equity",
    both: "Both",
    support: "Support",
    alone: "Alone",
    partners: "With partners",
    licensed: "Licensed"
  },
  bg: {
    open: "отворена",
    upcoming: "предстояща",
    closed: "затворена",
    rolling: "постоянна",
    ok: "наред",
    failed: "грешка",
    seeded: "начални данни",
    EU: "ЕС",
    Bulgaria: "България",
    International: "международна",
    Grant: "Грант",
    "Blended finance": "Смесено финансиране",
    Equity: "Дялово финансиране",
    "Scaleup investment": "Инвестиция за растеж",
    "Collaborative R&D": "Съвместна НИРД",
    Accelerator: "Акселератор",
    "Startup support": "Подкрепа за стартъпи",
    "Equity component": "Дялов компонент",
    "Startup visa": "Стартъп виза",
    "Administrative support": "Административна подкрепа",
    "Innovation voucher": "Иновационен ваучер",
    Idea: "Идея",
    Prototype: "Прототип",
    MVP: "MVP",
    "Early revenue": "Първи приходи",
    Scaleup: "Растеж",
    "R&D": "НИРД",
    AI: "ИИ",
    SaaS: "SaaS",
    "Deep tech": "Дълбоки технологии",
    Cybersecurity: "Киберсигурност",
    Fintech: "Финтех",
    Healthtech: "Здравни технологии",
    "Climate tech": "Климатични технологии",
    Robotics: "Роботика",
    Hardware: "Хардуер",
    "Digital transformation": "Дигитална трансформация",
    Low: "Ниска",
    Medium: "Средна",
    High: "Висока",
    "Very high": "Много висока",
    yes: "да",
    no: "не",
    unknown: "неизвестно",
    none: "няма",
    some: "има",
    growth: "растеж",
    licensed: "лицензирана",
    grant: "грант",
    equity: "дялово финансиране",
    both: "и двете",
    support: "подкрепа",
    alone: "самостоятелно",
    partners: "с партньори",
    Commercialisation: "Комерсиализация",
    Digitalisation: "Дигитализация",
    "Market expansion": "Пазарна експанзия",
    eligible: "допустим",
    "possibly eligible": "вероятно допустим",
    "not eligible": "недопустим",
    "missing information": "липсва информация"
  }
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("grantforge.locale");
    if (saved === "en" || saved === "bg") {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    function setLocale(nextLocale: Locale) {
      setLocaleState(nextLocale);
      window.localStorage.setItem("grantforge.locale", nextLocale);
      document.documentElement.lang = nextLocale;
    }

    function t(key: string) {
      return translations[locale][key] ?? translations.en[key] ?? key;
    }

    function label(rawValue: string) {
      return valueLabels[locale][rawValue] ?? rawValue;
    }

    return { locale, setLocale, t, label };
  }, [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return context;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="GrantForge home">
          <span className="brand-mark">GF</span>
          <span>GrantForge</span>
        </Link>
        <HeaderNav />
      </header>
      {children}
    </LanguageProvider>
  );
}

function HeaderNav() {
  const { locale, setLocale, t } = useLanguage();
  const nextLocale: Locale = locale === "en" ? "bg" : "en";

  return (
    <div className="header-actions">
      <nav className="top-nav" aria-label="Primary navigation">
        <Link href="/">{t("nav.programs")}</Link>
        <Link href="/checker">{t("nav.eligibility")}</Link>
        <Link href="/documents">{t("nav.documents")}</Link>
        <Link href="/saved">{t("nav.saved")}</Link>
        <Link href="/admin/sources">{t("nav.sources")}</Link>
      </nav>
      <button
        className="language-toggle"
        type="button"
        aria-label={t("language.label")}
        onClick={() => setLocale(nextLocale)}
      >
        {t("language.toggle")}
      </button>
    </div>
  );
}
