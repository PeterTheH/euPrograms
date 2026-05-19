"use client";

import { useLanguage } from "./LanguageProvider";

export function HomeHero({
  openCount,
  bgCount,
  euCount
}: {
  openCount: number;
  bgCount: number;
  euCount: number;
}) {
  const { t } = useLanguage();

  return (
    <section className="dashboard-hero">
      <div>
        <p className="eyebrow">{t("home.eyebrow")}</p>
        <h1>{t("home.title")}</h1>
      </div>
      <div className="stats-row" aria-label="Funding database summary">
        <div>
          <strong>{openCount}</strong>
          <span>{t("home.stats.open")}</span>
        </div>
        <div>
          <strong>{bgCount}</strong>
          <span>{t("home.stats.bg")}</span>
        </div>
        <div>
          <strong>{euCount}</strong>
          <span>{t("home.stats.eu")}</span>
        </div>
      </div>
    </section>
  );
}

export function SimpleHeader({ eyebrowKey, titleKey }: { eyebrowKey: string; titleKey: string }) {
  const { t } = useLanguage();

  return (
    <section className="simple-header">
      <p className="eyebrow">{t(eyebrowKey)}</p>
      <h1>{t(titleKey)}</h1>
    </section>
  );
}
