"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { SaveProgramButton } from "./SaveProgramButton";
import { deadlineLabel, daysUntilDeadline, formatDate } from "@/lib/program-utils";
import type { Program, ProgramStatus } from "@/lib/types";

type FilterState = {
  region: string;
  funding: string;
  sector: string;
  stage: string;
  status: ProgramStatus | "all";
  deadlineSoon: boolean;
  highFunding: boolean;
};

const defaultFilters: FilterState = {
  region: "all",
  funding: "all",
  sector: "all",
  stage: "all",
  status: "all",
  deadlineSoon: false,
  highFunding: false
};

export function ProgramExplorer({ programs }: { programs: Program[] }) {
  const { t, label, text, locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const regions = unique(programs.map((program) => program.regionType));
  const fundings = unique(programs.flatMap((program) => program.fundingType));
  const sectors = unique(programs.flatMap((program) => program.sectors));
  const stages = unique(programs.flatMap((program) => program.startupStages));

  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return programs.filter((program) => {
      const haystack = [
        program.title,
        text(program.title),
        program.provider,
        text(program.provider),
        program.description,
        text(program.description),
        program.eligibilitySummary,
        text(program.eligibilitySummary),
        ...program.sectors,
        ...program.fundingType,
        ...program.startupStages,
        ...program.sectors.map(label),
        ...program.fundingType.map(label),
        ...program.startupStages.map(label)
      ]
        .join(" ")
        .toLowerCase();

      const deadlineDays = daysUntilDeadline(program);

      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (filters.region === "all" || program.regionType === filters.region) &&
        (filters.funding === "all" || program.fundingType.includes(filters.funding)) &&
        (filters.sector === "all" || program.sectors.includes(filters.sector)) &&
        (filters.stage === "all" || program.startupStages.includes(filters.stage)) &&
        (filters.status === "all" || program.status === filters.status) &&
        (!filters.deadlineSoon || (deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 30)) &&
        (!filters.highFunding || (program.maxFundingEur !== null && program.maxFundingEur >= 1000000))
      );
    });
  }, [filters, label, programs, query, text]);

  return (
    <section className="explorer-layout">
      <aside className="filter-panel" aria-label={t("filters.title")}>
        <div className="filter-header">
          <h2>{t("filters.title")}</h2>
          <button className="link-button" type="button" onClick={() => setFilters(defaultFilters)}>
            {t("filters.reset")}
          </button>
        </div>

        <FilterSelect label={t("filters.region")} value={filters.region} options={regions} onChange={(region) => setFilters({ ...filters, region })} />
        <FilterSelect label={t("filters.funding")} value={filters.funding} options={fundings} onChange={(funding) => setFilters({ ...filters, funding })} />
        <FilterSelect label={t("filters.sector")} value={filters.sector} options={sectors} onChange={(sector) => setFilters({ ...filters, sector })} />
        <FilterSelect label={t("filters.stage")} value={filters.stage} options={stages} onChange={(stage) => setFilters({ ...filters, stage })} />
        <FilterSelect
          label={t("filters.status")}
          value={filters.status}
          options={["open", "upcoming", "closed", "rolling"]}
          onChange={(status) => setFilters({ ...filters, status: status as FilterState["status"] })}
        />

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={filters.deadlineSoon}
            onChange={(event) => setFilters({ ...filters, deadlineSoon: event.target.checked })}
          />
          <span>{t("filters.deadlineSoon")}</span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={filters.highFunding}
            onChange={(event) => setFilters({ ...filters, highFunding: event.target.checked })}
          />
          <span>{t("filters.highFunding")}</span>
        </label>
      </aside>

      <div className="program-results">
        <div className="search-row">
          <label className="search-box">
            <span>{t("common.search")}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search.placeholder")}
            />
          </label>
          <div className="result-count">{filteredPrograms.length} {t("common.programmes")}</div>
        </div>

        <div className="program-grid">
          {filteredPrograms.map((program) => (
            <article className="program-card" key={program.id}>
              <div className="card-topline">
                <span className={`badge status-${program.status}`}>{label(program.status)}</span>
                <span className="badge">{label(program.regionType)}</span>
                <span className="deadline-pill">{deadlineLabel(program, locale)}</span>
              </div>

              <h2>
                <Link href={`/programs/${program.id}`}>{text(program.title)}</Link>
              </h2>
              <p className="provider">{text(program.provider)}</p>
              <p>{text(program.eligibilitySummary)}</p>

              <dl className="card-facts">
                <div>
                  <dt>{t("common.funding")}</dt>
                  <dd>{text(program.amount)}</dd>
                </div>
                <div>
                  <dt>{t("common.deadline")}</dt>
                  <dd>{formatDate(program.deadline, locale)}</dd>
                </div>
                <div>
                  <dt>{t("common.stage")}</dt>
                  <dd>{program.startupStages.slice(0, 3).map(label).join(", ")}</dd>
                </div>
                <div>
                  <dt>{t("common.difficulty")}</dt>
                  <dd>{label(program.difficulty)}</dd>
                </div>
              </dl>

              <div className="tag-row">
                {program.sectors.slice(0, 5).map((sector) => (
                  <span key={sector}>{label(sector)}</span>
                ))}
              </div>

              <div className="card-actions">
                <Link className="button primary" href={`/programs/${program.id}`}>
                  {t("common.details")}
                </Link>
                <Link className="button ghost" href={`/checker?program=${program.id}`}>
                  {t("common.checkFit")}
                </Link>
                <SaveProgramButton programId={program.id} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function capitalizeOptionLabel(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase() + value.slice(1) : value;
}

function FilterSelect({
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
    <label className="filter-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">{t("common.all")}</option>
        {options.map((option) => (
          <option value={option} key={option}>
            {capitalizeOptionLabel(translateLabel(option))}
          </option>
        ))}
      </select>
    </label>
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
