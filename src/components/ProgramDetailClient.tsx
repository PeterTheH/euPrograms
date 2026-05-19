"use client";

import Link from "next/link";
import { SaveProgramButton } from "@/components/SaveProgramButton";
import { deadlineLabel, formatDate } from "@/lib/program-utils";
import type { ApplicationTip, Program } from "@/lib/types";
import { useLanguage } from "./LanguageProvider";

export function ProgramDetailClient({
  program,
  similar,
  tips
}: {
  program: Program;
  similar: Program[];
  tips: ApplicationTip[];
}) {
  const { t, label } = useLanguage();

  return (
    <main className="page-shell detail-shell">
      <div className="back-row">
        <Link href="/">{t("detail.back")}</Link>
      </div>

      <section className="detail-header">
        <div>
          <div className="badge-row">
            <span className={`badge status-${program.status}`}>{label(program.status)}</span>
            <span className="badge">{label(program.regionType)}</span>
            {program.fundingType.slice(0, 3).map((type) => (
              <span className="badge" key={type}>{label(type)}</span>
            ))}
          </div>
          <h1>{program.title}</h1>
          <p>{program.description}</p>
        </div>
        <aside className="detail-facts" aria-label={t("detail.facts")}>
          <dl>
            <div>
              <dt>{t("common.provider")}</dt>
              <dd>{program.provider}</dd>
            </div>
            <div>
              <dt>{t("common.deadline")}</dt>
              <dd>{deadlineLabel(program)} ({formatDate(program.deadline)})</dd>
            </div>
            <div>
              <dt>{t("common.funding")}</dt>
              <dd>{program.amount}</dd>
            </div>
            <div>
              <dt>{t("common.difficulty")}</dt>
              <dd>{label(program.difficulty)}</dd>
            </div>
          </dl>
          <div className="cta-stack">
            <Link className="button primary" href={`/checker?program=${program.id}`}>
              {t("detail.generatePack")}
            </Link>
            <SaveProgramButton programId={program.id} />
            <a className="button ghost" href={program.officialUrl} target="_blank" rel="noreferrer">
              {t("common.officialSource")}
            </a>
          </div>
        </aside>
      </section>

      <section className="detail-grid">
        <InfoSection title={t("detail.canApply")} items={program.whoCanApply} />
        <InfoSection title={t("detail.cannotApply")} items={program.whoCannotApply} />
        <InfoSection title={t("detail.eligibleCosts")} items={program.eligibleCosts} />
        <InfoSection title={t("detail.requiredDocs")} items={program.requiredDocuments} />
        <InfoSection title={t("detail.selectionCriteria")} items={program.evaluationCriteria} />
        <InfoSection title={t("detail.applicationFocus")} items={program.applicationFocus} />
      </section>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">{t("detail.tips")}</p>
          <h2>{t("detail.tipsHeading")}</h2>
        </div>
        <div className="tips-grid">
          {tips.map((tip) => (
            <article className="tip-card" key={tip.title}>
              <h3>{tip.title}</h3>
              <p>{tip.detail}</p>
              <a href={tip.sourceUrl} target="_blank" rel="noreferrer">{tip.sourceRequirement}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">{t("detail.similar")}</p>
          <h2>{t("detail.related")}</h2>
        </div>
        <div className="compact-program-list">
          {similar.map((item) => (
            <Link href={`/programs/${item.id}`} key={item.id}>
              <span>{item.title}</span>
              <small>{item.provider}</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function InfoSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="info-panel">
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
