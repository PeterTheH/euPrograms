"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import type {
  ApplicationPack,
  DocumentSection,
  EligibilityResult,
  FounderProfile,
  Program,
  SectionDraftResult,
  SectionReviewResult
} from "@/lib/types";

const initialProfile: FounderProfile = {
  companyCountry: "",
  isSme: "",
  sector: "",
  stage: "",
  hasRevenue: "",
  hasPrototype: "",
  ownsIp: "",
  fundingNeed: "",
  applicationMode: "",
  previousEuFunding: "",
  projectType: "",
  projectDescription: ""
};

export function EligibilityFlow({
  programs,
  initialProgramId
}: {
  programs: Program[];
  initialProgramId?: string;
}) {
  const { t, label } = useLanguage();
  const startingProgramId = programs.some((program) => program.id === initialProgramId)
    ? initialProgramId
    : programs[0]?.id ?? "";
  const [programId, setProgramId] = useState(startingProgramId);
  const [profile, setProfile] = useState<FounderProfile>(initialProfile);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [pack, setPack] = useState<ApplicationPack | null>(null);
  const [loading, setLoading] = useState<"eligibility" | "pack" | null>(null);
  const [error, setError] = useState("");

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === programId) ?? programs[0],
    [programId, programs]
  );

  const sectors = useMemo(() => Array.from(new Set(programs.flatMap((program) => program.sectors))).sort(), [programs]);

  async function checkEligibility() {
    setLoading("eligibility");
    setError("");
    setPack(null);

    try {
      const response = await fetch("/api/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, profile })
      });

      if (!response.ok) {
        throw new Error("Eligibility check failed.");
      }

      setEligibility((await response.json()) as EligibilityResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eligibility check failed.");
    } finally {
      setLoading(null);
    }
  }

  async function generatePack() {
    setLoading("pack");
    setError("");

    try {
      const response = await fetch("/api/application-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId, profile })
      });

      if (!response.ok) {
        throw new Error("Application pack generation failed.");
      }

      setPack((await response.json()) as ApplicationPack);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application pack generation failed.");
    } finally {
      setLoading(null);
    }
  }

  function updateProfile<Key extends keyof FounderProfile>(key: Key, value: FounderProfile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setEligibility(null);
    setPack(null);
  }

  function updateDescription(value: string) {
    setProfile((current) => ({ ...current, projectDescription: value }));
  }

  return (
    <section className="checker-layout">
      <div className="checker-form">
        <label className="form-control full">
          <span>{t("form.programme")}</span>
          <select
            value={programId}
            onChange={(event) => {
              setProgramId(event.target.value);
              setEligibility(null);
              setPack(null);
              setError("");
            }}
          >
            {programs.map((program) => (
              <option value={program.id} key={program.id}>
                {program.title}
              </option>
            ))}
          </select>
        </label>

        <FormSelect
          label={t("form.companyCountry")}
          value={profile.companyCountry}
          options={["Bulgaria", "EU", "Horizon associated", "Non-EU"]}
          onChange={(value) => updateProfile("companyCountry", value as FounderProfile["companyCountry"])}
        />
        <FormSelect
          label={t("form.sme")}
          value={profile.isSme}
          options={["yes", "no", "unknown"]}
          onChange={(value) => updateProfile("isSme", value as FounderProfile["isSme"])}
        />
        <FormSelect
          label={t("form.sector")}
          value={profile.sector}
          options={sectors}
          onChange={(value) => updateProfile("sector", value)}
        />
        <FormSelect
          label={t("form.productStage")}
          value={profile.stage}
          options={["Idea", "Prototype", "MVP", "Early revenue", "Scaleup", "R&D"]}
          onChange={(value) => updateProfile("stage", value as FounderProfile["stage"])}
        />
        <FormSelect
          label={t("form.revenue")}
          value={profile.hasRevenue}
          options={["none", "some", "growth", "unknown"]}
          onChange={(value) => updateProfile("hasRevenue", value as FounderProfile["hasRevenue"])}
        />
        <FormSelect
          label={t("form.prototype")}
          value={profile.hasPrototype}
          options={["yes", "no", "unknown"]}
          onChange={(value) => updateProfile("hasPrototype", value as FounderProfile["hasPrototype"])}
        />
        <FormSelect
          label={t("form.ip")}
          value={profile.ownsIp}
          options={["yes", "licensed", "no", "unknown"]}
          onChange={(value) => updateProfile("ownsIp", value as FounderProfile["ownsIp"])}
        />
        <FormSelect
          label={t("form.fundingNeed")}
          value={profile.fundingNeed}
          options={["grant", "equity", "both", "support"]}
          onChange={(value) => updateProfile("fundingNeed", value as FounderProfile["fundingNeed"])}
        />
        <FormSelect
          label={t("form.applicationMode")}
          value={profile.applicationMode}
          options={["alone", "partners", "unknown"]}
          onChange={(value) => updateProfile("applicationMode", value as FounderProfile["applicationMode"])}
        />
        <FormSelect
          label={t("form.previousEuFunding")}
          value={profile.previousEuFunding}
          options={["yes", "no", "unknown"]}
          onChange={(value) => updateProfile("previousEuFunding", value as FounderProfile["previousEuFunding"])}
        />
        <FormSelect
          label={t("form.projectType")}
          value={profile.projectType}
          options={["R&D", "Commercialisation", "Digitalisation", "Market expansion", "Administrative support"]}
          onChange={(value) => updateProfile("projectType", value as FounderProfile["projectType"])}
        />

        <label className="form-control full">
          <span>{t("form.projectDescription")}</span>
          <textarea
            value={profile.projectDescription}
            placeholder={t("form.projectDescriptionHint")}
            rows={4}
            onChange={(event) => updateDescription(event.target.value)}
          />
        </label>

        <div className="form-actions">
          <button className="button primary" type="button" onClick={checkEligibility} disabled={loading !== null}>
            {loading === "eligibility" ? t("form.checking") : t("form.checkEligibility")}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={generatePack}
            disabled={!eligibility || loading !== null}
          >
            {loading === "pack" ? t("form.generating") : t("detail.generatePack")}
          </button>
        </div>

        {loading === null && !eligibility ? <p className="form-hint">{t("form.packLockedNoCheck")}</p> : null}
      </div>

      <aside className="checker-output">
        {selectedProgram ? (
          <div className="selected-program">
            <span className={`badge status-${selectedProgram.status}`}>{label(selectedProgram.status)}</span>
            <h2>{selectedProgram.title}</h2>
            <p>{selectedProgram.eligibilitySummary}</p>
          </div>
        ) : null}

        {error ? <div className="alert error">{error}</div> : null}
        {eligibility ? <EligibilityResultPanel result={eligibility} /> : null}
        {pack ? (
          <ApplicationPackPanel key={pack.generatedAt} pack={pack} programId={programId ?? ""} profile={profile} />
        ) : null}
      </aside>
    </section>
  );
}

function FormSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const { t, label: translateLabel } = useLanguage();

  return (
    <label className="form-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{t("form.select")}</option>
        {options.map((option) => (
          <option value={option} key={option}>
            {translateLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function EligibilityResultPanel({ result }: { result: EligibilityResult }) {
  const { t, label } = useLanguage();

  return (
    <section className="result-panel">
      <div className="score-row">
        <span className={`score-badge result-${result.status.replace(" ", "-")}`}>{label(result.status)}</span>
        <strong>{result.score}% {t("result.fit")}</strong>
      </div>
      <ResultList title={t("result.why")} items={result.reasons} />
      {result.risks.length > 0 ? <ResultList title={t("result.risks")} items={result.risks} /> : null}
      {result.missing.length > 0 ? <ResultList title={t("result.missing")} items={result.missing} /> : null}
      <ResultList title={t("result.nextSteps")} items={result.nextSteps} />
    </section>
  );
}

function sectionKey(documentTitle: string, heading: string) {
  return `${documentTitle}::${heading}`;
}

function ApplicationPackPanel({
  pack,
  programId,
  profile
}: {
  pack: ApplicationPack;
  programId: string;
  profile: FounderProfile;
}) {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function setAnswer(key: string, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="pack-panel">
      <div className="pack-header">
        <div>
          <p className="eyebrow">{t("pack.eyebrow")}</p>
          <h2>{pack.programTitle} {t("pack.titleSuffix")}</h2>
        </div>
        <button
          className="button primary"
          type="button"
          onClick={() => {
            void downloadApplicationPackPdf(pack, answers, t("pack.titleSuffix"));
          }}
        >
          {t("pack.download")}
        </button>
      </div>

      {pack.eligibility.status === "not eligible" ? (
        <div className="alert">{t("pack.eligibilityWarning")}</div>
      ) : null}

      <div className="documents-list">
        {pack.documents.map((document) => (
          <article className="document-card" key={document.title}>
            <h3>{document.title}</h3>
            <p>{document.purpose}</p>
            {document.sections.map((section) => {
              const key = sectionKey(document.title, section.heading);
              return (
                <DocumentSectionEditor
                  key={key}
                  programId={programId}
                  profile={profile}
                  documentTitle={document.title}
                  section={section}
                  value={answers[key] ?? ""}
                  onChange={(value) => setAnswer(key, value)}
                />
              );
            })}
          </article>
        ))}
      </div>

      <div className="tips-list">
        <h3>{t("pack.tips")}</h3>
        {pack.applicationTips.map((tip) => (
          <article key={tip.title}>
            <h4>{tip.title}</h4>
            <p>{tip.detail}</p>
            <a href={tip.sourceUrl} target="_blank" rel="noreferrer">
              {tip.sourceRequirement}
            </a>
          </article>
        ))}
      </div>

      <div className="checklist">
        <h3>{t("pack.checklist")}</h3>
        <ul>
          {pack.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DocumentSectionEditor({
  programId,
  profile,
  documentTitle,
  section,
  value,
  onChange
}: {
  programId: string;
  profile: FounderProfile;
  documentTitle: string;
  section: DocumentSection;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState<"draft" | "review" | null>(null);
  const [review, setReview] = useState<SectionReviewResult | null>(null);

  async function callAssist(mode: "draft" | "review") {
    setBusy(mode);
    try {
      const response = await fetch("/api/section-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          mode,
          documentTitle,
          sectionHeading: section.heading,
          sectionPrompt: section.prompt,
          programSpecificNotes: section.programSpecificNotes,
          profile,
          userText: value
        })
      });

      if (!response.ok) {
        return;
      }

      if (mode === "draft") {
        const data = (await response.json()) as SectionDraftResult;
        if (data.draft) {
          onChange(data.draft);
        }
      } else {
        setReview((await response.json()) as SectionReviewResult);
      }
    } catch {
      // Assist is best-effort; never surface technical errors to the founder.
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="document-section">
      <h4>{section.heading}</h4>
      <p className="section-guidance">{section.prompt}</p>
      {section.programSpecificNotes.length > 0 ? (
        <ul>
          {section.programSpecificNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <textarea
        className="section-answer"
        value={value}
        placeholder={t("section.answerPlaceholder")}
        rows={6}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className="section-actions">
        <button className="button ghost" type="button" disabled={busy !== null} onClick={() => callAssist("draft")}>
          {busy === "draft" ? t("section.drafting") : t("section.draft")}
        </button>
        <button
          className="button ghost"
          type="button"
          disabled={busy !== null || !value.trim()}
          onClick={() => callAssist("review")}
        >
          {busy === "review" ? t("section.reviewing") : t("section.feedback")}
        </button>
      </div>

      {review ? (
        <div className="section-review">
          {review.strengths.length > 0 ? <ReviewList title={t("section.strengths")} items={review.strengths} /> : null}
          {review.gaps.length > 0 ? <ReviewList title={t("section.gaps")} items={review.gaps} /> : null}
          {review.rewrite ? (
            <div className="review-rewrite">
              <h5>{t("section.rewrite")}</h5>
              <p>{review.rewrite}</p>
              <button className="button ghost" type="button" onClick={() => onChange(review.rewrite)}>
                {t("section.useRewrite")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="review-block">
      <h5>{title}</h5>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="result-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "grantforge"
  );
}

// Builds a downloadable PDF that contains only the document structure and the
// founder's own written answers. Application tips and the per-section
// programme-note prompts are intentionally excluded — they are authoring aids,
// not content for a submission.
async function downloadApplicationPackPdf(
  pack: ApplicationPack,
  answers: Record<string, string>,
  titleSuffix: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function writeBlock(
    text: string,
    options: {
      size: number;
      style: "normal" | "bold" | "italic";
      gapBefore?: number;
      gapAfter?: number;
      color?: number;
    }
  ) {
    const { size, style, gapBefore = 0, gapAfter = 6, color = 30 } = options;
    if (!text.trim()) {
      return;
    }
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lineHeight = size * 1.35;
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    y += gapBefore;
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += gapAfter;
  }

  writeBlock(`${pack.programTitle} ${titleSuffix}`, { size: 20, style: "bold", gapAfter: 4 });
  writeBlock(`GrantForge — generated ${new Date(pack.generatedAt).toLocaleDateString()}`, {
    size: 10,
    style: "normal",
    color: 120,
    gapAfter: 16
  });

  for (const document of pack.documents) {
    writeBlock(document.title, { size: 15, style: "bold", gapBefore: 10, gapAfter: 2 });
    writeBlock(document.purpose, { size: 10, style: "italic", color: 90, gapAfter: 8 });

    for (const section of document.sections) {
      writeBlock(section.heading, { size: 12, style: "bold", gapBefore: 4, gapAfter: 3 });
      const answer = answers[sectionKey(document.title, section.heading)]?.trim();
      if (answer) {
        writeBlock(answer, { size: 11, style: "normal", gapAfter: 8 });
      } else {
        // Empty section: leave it blank (heading only), add spacing for the gap.
        y += 8;
      }
    }
  }

  writeBlock("Supporting document checklist", { size: 15, style: "bold", gapBefore: 12, gapAfter: 4 });
  for (const item of pack.checklist) {
    writeBlock(`•  ${item}`, { size: 11, style: "normal", gapAfter: 2 });
  }

  doc.save(`${slugify(pack.programTitle)}-application-pack.pdf`);
}
