"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

const storageKey = "grantforge.savedPrograms";
export const savedProgramsChangedEvent = "grantforge:savedProgramsChanged";

export function SaveProgramButton({ programId }: { programId: string }) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = readSaved();
    setSaved(existing.includes(programId));
  }, [programId]);

  function toggleSaved() {
    const existing = readSaved();
    const next = existing.includes(programId)
      ? existing.filter((id) => id !== programId)
      : [...existing, programId];

    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event(savedProgramsChangedEvent));
    setSaved(next.includes(programId));
  }

  return (
    <button className="button secondary" type="button" onClick={toggleSaved}>
      {saved ? t("common.saved") : t("common.save")}
    </button>
  );
}

export function readSaved(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
