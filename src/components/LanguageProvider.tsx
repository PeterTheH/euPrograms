"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, translateText, translateTexts, valueLabels, type Locale } from "@/lib/localization";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  label: (value: string) => string;
  text: (value: string | null | undefined) => string;
  texts: (values: string[]) => string[];
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
      return translations[locale][key] ?? translateText(translations.en[key] ?? key, locale);
    }

    function label(rawValue: string) {
      return valueLabels[locale][rawValue] ?? translateText(rawValue, locale);
    }

    function text(rawValue: string | null | undefined) {
      return rawValue ? translateText(rawValue, locale) : "";
    }

    function texts(rawValues: string[]) {
      return translateTexts(rawValues, locale);
    }

    return { locale, setLocale, t, label, text, texts };
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
        <BrandLink />
        <HeaderNav />
      </header>
      {children}
    </LanguageProvider>
  );
}

function BrandLink() {
  const { t } = useLanguage();

  return (
    <Link href="/" className="brand" aria-label={t("nav.homeLabel")}>
      <span className="brand-mark">GF</span>
      <span>GrantForge</span>
    </Link>
  );
}

function HeaderNav() {
  const { locale, setLocale, t } = useLanguage();
  const nextLocale: Locale = locale === "en" ? "bg" : "en";

  return (
    <div className="header-actions">
      <nav className="top-nav" aria-label={t("nav.primaryLabel")}>
        <Link href="/">{t("nav.programs")}</Link>
        <Link href="/checker">{t("nav.eligibility")}</Link>
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
