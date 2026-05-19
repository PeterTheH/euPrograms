"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import type { ApplicationPack, EligibilityResult, FounderProfile, Program } from "@/lib/types";

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
  projectType: ""
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

        <div className="form-actions">
          <button className="button primary" type="button" onClick={checkEligibility} disabled={loading !== null}>
            {loading === "eligibility" ? t("form.checking") : t("form.checkEligibility")}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={generatePack}
            disabled={!eligibility || eligibility.status === "not eligible" || loading !== null}
          >
            {loading === "pack" ? t("form.generating") : t("detail.generatePack")}
          </button>
        </div>
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
        {pack ? <ApplicationPackPanel pack={pack} /> : null}
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

function ApplicationPackPanel({ pack }: { pack: ApplicationPack }) {
  const { t } = useLanguage();

  return (
    <section className="pack-panel">
      <div className="pack-header">
        <div>
          <p className="eyebrow">{pack.aiProvider === "ollama" ? t("pack.ollama") : t("pack.fallback")}</p>
          <h2>{pack.programTitle} {t("pack.titleSuffix")}</h2>
        </div>
        <span className="badge">{pack.model}</span>
      </div>

      {pack.warning ? <div className="alert">{pack.warning}</div> : null}

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

      <div className="documents-list">
        {pack.documents.map((document) => (
          <article className="document-card" key={document.title}>
            <h3>{document.title}</h3>
            <p>{document.purpose}</p>
            {document.sections.map((section) => (
              <div className="document-section" key={`${document.title}-${section.heading}`}>
                <h4>{section.heading}</h4>
                <p>{section.prompt}</p>
                <ul>
                  {section.programSpecificNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ))}
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
