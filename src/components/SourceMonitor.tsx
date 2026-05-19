"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import type { SourceStatus } from "@/lib/types";

export function SourceMonitor({ initialSources }: { initialSources: SourceStatus[] }) {
  const { t, label } = useLanguage();
  const [sources, setSources] = useState(initialSources);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  async function refreshSources() {
    setRefreshing(true);
    setMessage("");

    try {
      const response = await fetch("/api/sources/refresh", { method: "POST" });
      if (!response.ok) {
        throw new Error("Source refresh failed.");
      }

      const data = (await response.json()) as { sources: SourceStatus[] };
      setSources(data.sources);
      setMessage(t("sources.complete"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("sources.failed"));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <section className="source-monitor">
      <div className="source-toolbar">
        <button className="button primary" type="button" onClick={refreshSources} disabled={refreshing}>
          {refreshing ? t("sources.refreshing") : t("sources.refresh")}
        </button>
        {message ? <span className="source-message">{message}</span> : null}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("sources.source")}</th>
              <th>{t("sources.status")}</th>
              <th>{t("sources.lastChecked")}</th>
              <th>{t("sources.new")}</th>
              <th>{t("sources.method")}</th>
              <th>{t("sources.notes")}</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.name}
                  </a>
                </td>
                <td>
                  <span className={`badge source-${source.status}`}>{label(source.status)}</span>
                  {source.lastError ? <small>{source.lastError}</small> : null}
                </td>
                <td>{source.lastChecked}</td>
                <td>{source.newPrograms}</td>
                <td>{source.method}</td>
                <td>{source.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
