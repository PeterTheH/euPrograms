"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { SaveProgramButton, readSaved, savedProgramsChangedEvent } from "./SaveProgramButton";
import { deadlineLabel } from "@/lib/program-utils";
import type { Program } from "@/lib/types";

export function SavedPrograms({ programs }: { programs: Program[] }) {
  const { t, label } = useLanguage();
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(readSaved());
    const listener = () => setSavedIds(readSaved());
    window.addEventListener("storage", listener);
    window.addEventListener(savedProgramsChangedEvent, listener);
    return () => {
      window.removeEventListener("storage", listener);
      window.removeEventListener(savedProgramsChangedEvent, listener);
    };
  }, []);

  const savedPrograms = useMemo(
    () => programs.filter((program) => savedIds.includes(program.id)),
    [programs, savedIds]
  );

  if (savedPrograms.length === 0) {
    return <div className="empty-state">{t("saved.empty")}</div>;
  }

  return (
    <div className="program-grid">
      {savedPrograms.map((program) => (
        <article className="program-card" key={program.id}>
          <div className="card-topline">
            <span className={`badge status-${program.status}`}>{label(program.status)}</span>
            <span className="deadline-pill">{deadlineLabel(program)}</span>
          </div>
          <h2>
            <Link href={`/programs/${program.id}`}>{program.title}</Link>
          </h2>
          <p className="provider">{program.provider}</p>
          <p>{program.eligibilitySummary}</p>
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
  );
}
