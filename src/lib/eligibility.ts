import type { EligibilityResult, FounderProfile, Program } from "./types";

const requiredProfileFields: Array<keyof FounderProfile> = [
  "companyCountry",
  "isSme",
  "sector",
  "stage",
  "hasRevenue",
  "hasPrototype",
  "ownsIp",
  "fundingNeed",
  "applicationMode",
  "projectType"
];

export function evaluateEligibility(program: Program, profile: FounderProfile): EligibilityResult {
  const reasons: string[] = [];
  const risks: string[] = [];
  // Hard requirement violations. These deterministically drive a "not eligible"
  // result instead of inferring it from fragile substring matching on risk text.
  const disqualifiers: string[] = [];
  const missing = requiredProfileFields
    .filter((field) => !profile[field])
    .map((field) => fieldLabel(field));

  let score = 50;

  if (missing.length > 0) {
    return {
      status: "missing information",
      score: Math.max(0, score - missing.length * 6),
      reasons: ["The profile is not complete enough to assess eligibility."],
      risks: [],
      missing,
      nextSteps: ["Complete the missing fields, then run the eligibility check again."]
    };
  }

  if (program.regionType === "Bulgaria") {
    if (program.id === "bg-startup-visa-2026") {
      if (profile.companyCountry === "Non-EU") {
        score += 20;
        reasons.push("The Startup Visa certificate is designed for third-country founders who want to build in Bulgaria.");
      } else {
        score -= 25;
        risks.push("This route is mainly for non-EU founders; EU/Bulgarian founders usually do not need it.");
      }
    } else if (profile.companyCountry === "Bulgaria") {
      score += 20;
      reasons.push("The company location matches the Bulgarian procedure scope.");
    } else {
      disqualifiers.push("Bulgarian grant procedures require a Bulgarian applicant or a Bulgarian implementation base.");
    }
  }

  if (program.regionType === "EU" || program.regionType === "International") {
    if (["Bulgaria", "EU", "Horizon associated"].includes(profile.companyCountry)) {
      score += 15;
      reasons.push("The company geography fits the European programme scope.");
    } else if (program.id !== "bg-startup-visa-2026") {
      disqualifiers.push("Most EU startup funding routes require an EU or Horizon Europe associated-country applicant.");
    }
  }

  const requiresSme =
    program.eligibilitySummary.toLowerCase().includes("sme") ||
    program.title.toLowerCase().includes("sme") ||
    program.whoCanApply.some((entry) => entry.toLowerCase().includes("sme"));

  if (requiresSme) {
    if (profile.isSme === "yes") {
      score += 18;
      reasons.push("SME status matches the core applicant requirement.");
    } else if (profile.isSme === "no") {
      disqualifiers.push("The programme requires SME status, which this profile does not have.");
    } else {
      score -= 6;
      risks.push("SME status is unconfirmed and must be verified before relying on this result.");
    }
  }

  if (program.sectors.some((sector) => sector.toLowerCase() === profile.sector.toLowerCase())) {
    score += 14;
    reasons.push(`${profile.sector} is listed as a strong sector fit.`);
  } else {
    score -= 5;
    risks.push("The selected sector is not one of the strongest listed fits, so positioning will matter.");
  }

  if (program.startupStages.includes(profile.stage)) {
    score += 14;
    reasons.push(`The ${profile.stage} stage fits the programme profile.`);
  } else {
    score -= 15;
    risks.push(`The programme is better aligned with ${program.startupStages.join(", ")} stage companies.`);
  }

  if (program.title.toLowerCase().includes("eic") || program.applicationFocus.includes("IP protection")) {
    if (profile.hasPrototype === "yes") {
      score += 8;
      reasons.push("Prototype evidence helps with high-risk innovation programmes.");
    } else {
      score -= 10;
      risks.push("EIC-style programmes usually need concrete technology validation.");
    }

    if (profile.ownsIp === "yes" || profile.ownsIp === "licensed") {
      score += 6;
      reasons.push("The IP position can support the innovation and defensibility story.");
    } else {
      score -= 8;
      risks.push("Weak IP control can hurt a deep-tech or breakthrough-innovation application.");
    }
  }

  if (program.id.includes("eurostars")) {
    if (profile.applicationMode === "partners") {
      score += 20;
      reasons.push("Eurostars expects international collaborative R&D consortia.");
    } else if (profile.applicationMode === "alone") {
      disqualifiers.push("Eurostars requires an international consortium; applying alone is not eligible.");
    } else {
      score -= 10;
      risks.push("Eurostars normally requires international project partners; confirm your consortium.");
    }

    if (profile.projectType === "R&D") {
      score += 12;
      reasons.push("The project type matches Eurostars' collaborative R&D focus.");
    } else {
      score -= 12;
      risks.push("Eurostars is not a good fit for purely commercial or routine digitalisation work.");
    }
  }

  if (program.applicationFocus.includes("SME eligibility") && profile.hasRevenue === "none") {
    score -= 10;
    risks.push("Several Bulgarian SME procedures require recent sales history or financial eligibility evidence.");
  }

  if (program.fundingType.some((type) => type.toLowerCase().includes("equity"))) {
    if (profile.fundingNeed === "equity" || profile.fundingNeed === "both") {
      score += 8;
      reasons.push("The funding need matches the programme's investment component.");
    } else {
      score -= 6;
      risks.push("This programme includes an investment angle, not only non-dilutive grant funding.");
    }
  }

  if (program.fundingType.some((type) => type.toLowerCase().includes("grant")) && profile.fundingNeed === "grant") {
    score += 6;
  }

  const isEuRoute =
    program.regionType === "EU" ||
    program.regionType === "International" ||
    program.title.toLowerCase().includes("eic") ||
    program.id.includes("eurostars");

  if (isEuRoute) {
    if (profile.previousEuFunding === "yes") {
      score += 5;
      reasons.push("Previous EU funding shows you can handle EU reporting and compliance, which strengthens delivery capacity.");
    } else if (profile.previousEuFunding === "no") {
      risks.push("No previous EU funding means evaluators will look harder for evidence that you can manage the project and its reporting.");
    }
  }

  const disqualified = disqualifiers.length > 0;
  score = disqualified ? Math.min(score, 35) : Math.max(0, Math.min(100, score));

  const status: EligibilityResult["status"] = disqualified
    ? "not eligible"
    : score >= 75
      ? "eligible"
      : "possibly eligible";

  return {
    status,
    score,
    reasons: reasons.length > 0 ? reasons : ["The profile has some alignment with the programme."],
    risks: [...disqualifiers, ...risks],
    missing: [],
    nextSteps: buildNextSteps(program, profile, status)
  };
}

function buildNextSteps(program: Program, profile: FounderProfile, status: EligibilityResult["status"]): string[] {
  if (status === "not eligible") {
    return [
      "Check the official eligibility rules before spending time on the application.",
      "Look at similar programmes with a better geography, stage, or applicant-type fit."
    ];
  }

  const steps = [
    "Open the official source and verify the current call documents.",
    "Create a short evidence file for eligibility, stage, sector fit, and funding need."
  ];

  if (program.id.includes("eurostars") && profile.applicationMode !== "partners") {
    steps.push("Identify international R&D partners before drafting the application.");
  }

  if (program.regionType === "Bulgaria") {
    steps.push("Prepare ISUN-ready cost justification, declarations, and supplier logic early.");
  }

  if (program.title.toLowerCase().includes("eic")) {
    steps.push("Prepare a sharp breakthrough-innovation claim and explain why private investors alone will not fund the current risk.");
  }

  return steps;
}

function fieldLabel(field: keyof FounderProfile): string {
  const labels: Record<keyof FounderProfile, string> = {
    companyCountry: "Company country",
    isSme: "SME status",
    sector: "Sector",
    stage: "Product stage",
    hasRevenue: "Revenue",
    hasPrototype: "Prototype",
    ownsIp: "IP position",
    fundingNeed: "Funding need",
    applicationMode: "Applying alone or with partners",
    previousEuFunding: "Previous EU funding",
    projectType: "Project type",
    projectDescription: "Project description"
  };
  return labels[field];
}
