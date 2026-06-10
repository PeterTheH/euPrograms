import { NextResponse } from "next/server";
import { generateOllamaJson } from "@/lib/ollama";
import { getProgramById } from "@/lib/programs";
import { translateText } from "@/lib/localization";
import type { FounderProfile, Program, SectionDraftResult, SectionReviewResult } from "@/lib/types";

type Locale = "en" | "bg";

type AssistBody = {
  programId?: string;
  mode?: "draft" | "review";
  documentTitle?: string;
  sectionHeading?: string;
  sectionPrompt?: string;
  programSpecificNotes?: string[];
  profile?: FounderProfile;
  userText?: string;
  locale?: Locale;
};


function hasUntranslatedEnglish(value: string): boolean {
  const withoutAllowedTerms = value
    .replace(/\b(EU|EIC|EIT|Eurostars|Horizon Europe|JSON|Ollama|AI|IP|ICT|R&D|MVP|SME|SMEs|TRL|ISUN|CO2)\b/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[A-Z]{2,}[A-Z0-9.-]*/g, "")
    .replace(/[0-9\s.,:;!?%()[\]{}&+\-/'"’"]/g, "");

  return /[A-Za-z]{3,}/.test(withoutAllowedTerms);
}

function reviewHasUntranslatedEnglish(result: SectionReviewResult): boolean {
  return [...result.strengths, ...result.gaps, result.rewrite].some((item) => hasUntranslatedEnglish(item));
}

export async function POST(request: Request) {
  const body = (await request.json()) as AssistBody;

  if (!body.programId || !body.mode || !body.sectionHeading) {
    return NextResponse.json({ error: "programId, mode and sectionHeading are required." }, { status: 400 });
  }

  const locale: Locale = body.locale === "bg" ? "bg" : "en";



  const program = await getProgramById(body.programId);
  if (!program) {
    return NextResponse.json({ error: "Program not found." }, { status: 404 });
  }

  const languageInstruction = locale === "bg"


    ? "Write every user-facing value in Bulgarian. Keep JSON keys, official programme names, acronyms, URLs, and bracketed placeholders unchanged."


    : "Write every user-facing value in English.";



  const sectionContext = {
    programTitle: program.title,
    provider: program.provider,
    fundingType: program.fundingType,
    evaluationCriteria: program.evaluationCriteria,
    applicationFocus: program.applicationFocus,
    requiredDocuments: program.requiredDocuments,
    documentTitle: body.documentTitle ?? "",
    sectionHeading: body.sectionHeading,
    sectionPrompt: body.sectionPrompt ?? "",
    programSpecificNotes: body.programSpecificNotes ?? [],
    founderProfile: body.profile ?? null,
    projectDescription: body.profile?.projectDescription ?? "",
    outputLanguage: locale === "bg" ? "Bulgarian" : "English"
  };

  if (body.mode === "draft") {
    const systemPrompt = [
      "You are GrantForge, an application-writing assistant for EU and Bulgarian technology-startup funding.",
      "Return only valid JSON of the shape { \"draft\": string }. Do not include markdown.",
      "Write a concise first-draft for the requested section, in the founder's voice, 120-220 words.",
      "Ground every sentence in the supplied founder profile and project description.",
      "Where a specific fact is unknown, insert a clearly bracketed placeholder like [add metric] instead of inventing it.",
      "Do not invent deadlines, funding amounts, partners, or eligibility rules.",
      languageInstruction
    ].join(" ");

    const userPrompt = JSON.stringify(
      { task: "Draft this application section.", outputShape: { draft: "string" }, ...sectionContext },
      null,
      2
    );

    const fallback: SectionDraftResult = { draft: buildDraftFallback(program, body, locale) };
    const result = await generateOllamaJson<SectionDraftResult>(systemPrompt, userPrompt, fallback);
    const generatedDraft = typeof result.data.draft === "string" && result.data.draft.trim() ? result.data.draft : fallback.draft;
    const draft = locale === "bg" && hasUntranslatedEnglish(generatedDraft) ? fallback.draft : generatedDraft;
    return NextResponse.json({ draft });
  }

  const systemPrompt = [
    "You are GrantForge, an evaluator-style reviewer for EU and Bulgarian technology-startup funding applications.",
    "Return only valid JSON of the shape { \"strengths\": string[], \"gaps\": string[], \"rewrite\": string }. Do not include markdown.",
    "Judge the founder's text strictly against the programme's evaluation criteria and application focus.",
    "strengths: what already works. gaps: specific, actionable fixes (missing evidence, vague claims, unquantified impact).",
    "rewrite: a tightened version of the founder\'s text, same facts, sharper and evaluator-ready. Never invent facts; keep placeholders the founder did not provide.",
    languageInstruction
  ].join(" ");

  const userPrompt = JSON.stringify(
    {
      task: "Review and improve this application section.",
      outputShape: { strengths: ["string"], gaps: ["string"], rewrite: "string" },
      founderText: body.userText ?? "",
      ...sectionContext
    },
    null,
    2
  );

  const fallback = buildReviewFallback(program, body, locale);
  const result = await generateOllamaJson<SectionReviewResult>(systemPrompt, userPrompt, fallback);
  const data = result.data;
  const reviewed: SectionReviewResult = {
    strengths: Array.isArray(data.strengths) ? data.strengths : fallback.strengths,
    gaps: Array.isArray(data.gaps) && data.gaps.length > 0 ? data.gaps : fallback.gaps,
    rewrite: typeof data.rewrite === "string" ? data.rewrite : fallback.rewrite
  };

  return NextResponse.json(locale === "bg" && reviewHasUntranslatedEnglish(reviewed) ? fallback : reviewed);
}

// Best-effort guess of the venture's name from the leading proper noun of the
// description, e.g. "KerbFlow is an AI platform..." -> "KerbFlow".
function extractVentureName(description: string): string {
  const match = description
    .trim()
    .match(
      /^([A-Z][A-Za-z0-9&.+-]*(?:\s+[A-Z][A-Za-z0-9&.+-]*){0,2}?)\s+(?:is|are|provides|builds|develops|offers|delivers|helps|enables|turns|makes)\b/
    );
  return match ? match[1] : "Our venture";
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  const match = trimmed.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

// Turns the structured FounderProfile enums into reusable, human-readable
// fragments so the deterministic draft reads like prose, not a form dump.
function profilePhrases(profile: FounderProfile) {
  const country: Record<string, string> = {
    Bulgaria: "a Bulgaria-based",
    EU: "an EU-based",
    "Horizon associated": "a Horizon Europe associated-country",
    "Non-EU": "a non-EU"
  };
  const revenue: Record<string, string> = {
    none: "is pre-revenue",
    some: "has early paid revenue",
    growth: "has growing revenue",
    unknown: "has [confirm revenue status]"
  };
  const funding: Record<string, string> = {
    grant: "non-dilutive grant support",
    equity: "investment",
    both: "blended grant and investment support",
    support: "acceleration and venture-building support"
  };
  const ip: Record<string, string> = {
    yes: "owns its core IP",
    licensed: "operates on licensed IP",
    no: "has not yet secured IP protection",
    unknown: "is [confirm IP position]"
  };
  return {
    origin: country[profile.companyCountry] ?? "a",
    sme: profile.isSme === "yes" ? "SME" : "company",
    sector: profile.sector ? profile.sector.toLowerCase() : "technology",
    stage: profile.stage || "early",
    revenue: revenue[profile.hasRevenue] ?? "has [confirm revenue]",
    prototype: profile.hasPrototype === "yes" ? "a working prototype" : "an early build",
    ip: ip[profile.ownsIp] ?? "is [confirm IP position]",
    funding: funding[profile.fundingNeed] ?? "funding support",
    mode: profile.applicationMode === "partners" ? "with project partners" : "as a single applicant",
    projectType: profile.projectType ? profile.projectType.toLowerCase() : "the project"
  };
}

function buildDraftFallback(program: Program, body: AssistBody, locale: Locale): string {
  if (locale === "bg") {
    return buildBulgarianDraftFallback(program, body);
  }
  const profile = body.profile;
  const description = profile?.projectDescription?.trim() ?? "";

  // Without founder input there is nothing to write from, so keep the scaffold.
  if (!profile || !description) {
    const notes = (body.programSpecificNotes ?? []).map((note) => `- ${note}`).join("\n");
    return [
      `Draft starting point for "${body.sectionHeading}" (${program.title}).`,
      body.sectionPrompt ? `\nGoal of this section: ${body.sectionPrompt}` : "",
      notes ? `\nMake sure to cover:\n${notes}` : "",
      "\nAdd your project description and founder profile in the checker, then regenerate to get a written first draft."
    ]
      .filter(Boolean)
      .join("\n");
  }

  const p = profilePhrases(profile);
  const name = extractVentureName(description);
  const lead = firstSentence(description);
  const focus = program.applicationFocus.slice(0, 3).join(", ");
  const heading = (body.sectionHeading ?? "").toLowerCase();
  const identity = `${name} is ${p.origin} ${p.sector} ${p.sme} at the ${p.stage} stage`;

  let draft: string;

  if (heading.includes("executive summary")) {
    draft = [
      `${identity}.`,
      lead,
      `We are applying to ${program.title} (${program.provider}) for ${p.funding} to advance ${p.projectType}, ${p.mode}.`,
      `Today the company ${p.revenue}, has ${p.prototype}, and ${p.ip}; our strongest evidence so far is [add 1-2 concrete metrics: pilots, users, CO2 or congestion reduction, revenue].`,
      `This programme is a strong fit because our work directly serves its focus on ${focus}, and we meet its eligibility as ${p.origin} ${p.sme}.`
    ].join(" ");
  } else if (heading.includes("problem") || heading.includes("market need")) {
    draft = [
      lead,
      `The customers who feel this problem most are [name the buyer: cities, fleet operators, etc.], who today rely on [current alternative] and lose [add cost, time, or emissions metric] as a result.`,
      `The need is urgent because [add driver: regulation, congestion targets, cost pressure].`,
      `Early demand signals: [add pilot, letter of intent, or pipeline evidence].`,
      `This maps directly to the programme's focus on ${focus}.`
    ].join(" ");
  } else if (heading.includes("solution") || heading.includes("innovation")) {
    draft = [
      lead,
      `What is genuinely new is [name the specific technical or model innovation], which improves on existing approaches by [add measurable gain, e.g. % faster, % lower emissions].`,
      `The company ${p.ip} and currently has ${p.prototype}, validated by [add test result or pilot metric].`,
      `This innovation underpins the impact ${program.provider} evaluates under ${focus}.`
    ].join(" ");
  } else if (heading.includes("implementation") || heading.includes("milestone") || heading.includes("commercial")) {
    const costNote =
      program.regionType === "Bulgaria"
        ? " Each activity is mapped to an eligible ISUN cost category and a supplier or market-price basis."
        : "";
    draft = [
      `We will deliver ${p.projectType} through [number] work packages over [add duration] months.`,
      `Key activities: [activity 1], [activity 2], and [activity 3], each with a named owner and a measurable output.${costNote}`,
      `Milestones: [M1 + date + acceptance criterion], [M2 + date], and [M3 + date], tied to ${focus}.`,
      `The requested ${p.funding} funds the work needed to reach [add commercial or validation milestone].`
    ].join(" ");
  } else if (heading.includes("budget") || heading.includes("cost") || heading.includes("financing")) {
    const costs = program.eligibleCosts.slice(0, 3).join(", ");
    draft = [
      `The budget concentrates on eligible costs: ${costs}.`,
      `Main lines: [line 1 + amount + supplier basis], [line 2 + amount], and [line 3 + amount], each tied to a project activity.`,
      `We request ${p.funding}; the company ${p.revenue} and covers co-financing from [own funds, revenue, or investors].`,
      `[Confirm total project cost and grant intensity against the call documents.]`
    ].join(" ");
  } else if (heading.includes("technical") || heading.includes("feasibility")) {
    draft = [
      `${name} currently has ${p.prototype} at approximately [add TRL].`,
      lead,
      `To de-risk the project we will [experiment or build 1], [task 2], and [certification or integration 3], separating genuine R&D from routine development.`,
      `Feasibility is supported by [add benchmark, test, or pilot result].`
    ].join(" ");
  } else if (heading.includes("ip") || heading.includes("defensib")) {
    draft = [
      `${name} ${p.ip}, covering [name the protected asset: algorithm, dataset, design, or know-how].`,
      `We have freedom to operate because [add basis], and our defensibility also rests on [data, network effects, or integrations].`,
      `[Confirm any filed or pending IP rights.]`
    ].join(" ");
  } else if (heading.includes("team")) {
    draft = [
      `${name} is led by [founder names], combining [technical], [commercial], and [domain] expertise.`,
      `The team has delivered [add relevant prior result], and the company ${p.ip}.`,
      `Gaps in [name area] will be closed using this ${p.funding}.`
    ].join(" ");
  } else if (
    heading.includes("customer") ||
    heading.includes("competitive") ||
    heading.includes("go-to-market") ||
    heading.includes("market")
  ) {
    draft = [
      `Our beachhead customers are [segment], who buy because [value driver].`,
      lead,
      `Versus [direct alternative] and the status quo, we win on [quantified differentiator].`,
      `Traction so far: the company ${p.revenue} and has [add pilot or customer evidence], aligned with the impact ${program.provider} rewards under ${focus}.`
    ].join(" ");
  } else if (heading.includes("risk")) {
    draft = [
      `Key risks for ${name}: technical ([risk] - mitigated by [action]), market ([risk] - [action]), and delivery ([risk] - [action]).`,
      `As ${p.origin} ${p.sme} applying ${p.mode}, our main compliance risk is [add risk], which we manage by [action].`
    ].join(" ");
  } else {
    draft = [
      `${identity}.`,
      lead,
      body.sectionPrompt ? `For this section: ${body.sectionPrompt}.` : "",
      `Connect this to the programme's focus on ${focus}, and add concrete evidence [metric, pilot, customer, or IP] where marked.`
    ]
      .filter(Boolean)
      .join(" ");
  }

  return `${draft}\n\n[Deterministic starting draft generated without Ollama. Replace the bracketed placeholders with confirmed facts, then use Review to sharpen it.]`;
}

function buildBulgarianDraftFallback(program: Program, body: AssistBody): string {
  const profile = body.profile;
  const description = profile?.projectDescription?.trim() ?? "";
  const sectionHeading = translateText(body.sectionHeading ?? "раздел", "bg");
  const programTitle = translateText(program.title, "bg");
  const provider = translateText(program.provider, "bg");

  if (!profile || !description) {
    const notes = (body.programSpecificNotes ?? []).map((note) => "- " + translateText(note, "bg")).join("\n");
    return [
      "Начална чернова за \"" + sectionHeading + "\" (" + programTitle + ").",
      body.sectionPrompt ? "\nЦел на раздела: " + translateText(body.sectionPrompt, "bg") : "",
      notes ? "\nПокрийте следното:\n" + notes : "",
      "\nДобавете описание на проекта и профил на основателя в проверката, след това генерирайте отново, за да получите написана начална чернова."
    ]
      .filter(Boolean)
      .join("\n");
  }

  const name = extractVentureName(description);
  const origin: Record<string, string> = {
    Bulgaria: "с регистрация в България",
    EU: "с регистрация в ЕС",
    "Horizon associated": "от държава, асоциирана към Horizon Europe",
    "Non-EU": "извън ЕС"
  };
  const funding: Record<string, string> = {
    grant: "грантова подкрепа",
    equity: "инвестиция",
    both: "смесено грантово и инвестиционно финансиране",
    support: "акселераторска и експертна подкрепа"
  };
  const mode = profile.applicationMode === "partners" ? "с проектни партньори" : "като самостоятелен кандидат";
  const applicant = profile.isSme === "yes" ? "МСП" : "компания";
  const sector = profile.sector ? translateText(profile.sector, "bg") : "технологии";
  const stage = profile.stage ? translateText(profile.stage, "bg") : "ранен етап";
  const projectType = profile.projectType ? translateText(profile.projectType, "bg").toLowerCase() : "проекта";
  const focus = program.applicationFocus.slice(0, 3).map((item) => translateText(item, "bg")).join(", ");

  return [
    name + " е " + applicant + " " + (origin[profile.companyCountry] ?? "") + ", работеща в сектор " + sector + ", на етап " + stage + ".",
    "Кандидатстваме по " + programTitle + " (" + provider + ") за " + (funding[profile.fundingNeed] ?? "финансиране") + ", за да развием " + projectType + " " + mode + ".",
    focus ? "В този раздел трябва ясно да покажем връзката с фокуса на програмата: " + focus + "." : "",
    "Добавете конкретни доказателства: [метрика], [пилот или клиент], [бюджетна линия] и [очакван резултат]."
  ]
    .filter(Boolean)
    .join(" ") + "\n\n[Детерминистична начална чернова без Ollama. Заменете полетата в скоби с потвърдени факти, след това използвайте прегледа, за да я изчистите.]";
}

function buildReviewFallback(program: Program, body: AssistBody, locale: Locale): SectionReviewResult {
  if (locale === "bg") {
    return buildBulgarianReviewFallback(program, body);
  }
  const text = (body.userText ?? "").trim();
  const hasText = text.length > 0;

  if (!hasText) {
    return {
      strengths: [],
      gaps: [
        "Write a first draft before requesting a review, or use the Draft action to generate a starting point.",
        ...program.evaluationCriteria.slice(0, 2).map((criterion) => `This section must clearly address: ${criterion}.`)
      ],
      rewrite: ""
    };
  }

  // Heuristics so the offline review reflects the actual text, not a fixed list.
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasNumbers = /\d/.test(text);
  const hasPlaceholders = /\[[^\]]+\]/.test(text);

  const strengths: string[] = ["You have drafted content to build on for this section."];
  if (hasNumbers) {
    strengths.push("The text already includes concrete figures, which evaluators look for.");
  }
  if (wordCount >= 80) {
    strengths.push("The section has enough length to make a substantive case.");
  }

  const gaps: string[] = [];
  if (!hasNumbers) {
    gaps.push("No numbers yet: add at least one metric, pilot result, or revenue/usage figure.");
  }
  if (hasPlaceholders) {
    gaps.push("Resolve the remaining [bracketed placeholders] before submission; evaluators read them as missing evidence.");
  }
  if (wordCount < 60) {
    gaps.push("The draft is short; expand the strongest claim with evidence rather than adding generic statements.");
  }
  gaps.push("Tie each claim to specific evidence: a metric, pilot result, customer, IP status, or benchmark.");
  program.evaluationCriteria
    .slice(0, 2)
    .forEach((criterion) => gaps.push(`Make sure this section clearly addresses: ${criterion}.`));

  // A deterministic "rewrite": tighten the founder's own text and append an
  // evaluator-facing impact line, without inventing facts.
  const focus = program.applicationFocus.slice(0, 2).join(" and ");
  const tightened = text.replace(/\s+/g, " ").trim();
  const rewrite = [
    tightened,
    focus ? `In evaluator terms, this directly supports ${focus}; quantify that impact with [add metric] to make it land.` : ""
  ]
    .filter(Boolean)
    .join(" ");

  return { strengths, gaps, rewrite };
}

function buildBulgarianReviewFallback(program: Program, body: AssistBody): SectionReviewResult {
  const text = (body.userText ?? "").trim();
  const hasText = text.length > 0;

  if (!hasText) {
    return {
      strengths: [],
      gaps: [
        "Напишете първа чернова преди заявка за преглед или използвайте бутона за чернова, за да генерирате начална версия.",
        ...program.evaluationCriteria.slice(0, 2).map((criterion) => "Този раздел трябва ясно да адресира: " + translateText(criterion, "bg") + ".")
      ],
      rewrite: ""
    };
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasNumbers = /\d/.test(text);
  const hasPlaceholders = /\[[^\]]+\]/.test(text);

  const strengths: string[] = ["Имате начално съдържание, върху което може да се надгради в този раздел."];
  if (hasNumbers) {
    strengths.push("Текстът вече включва конкретни числа, които оценителите търсят.");
  }
  if (wordCount >= 80) {
    strengths.push("Разделът е достатъчно развит, за да изгради съдържателен аргумент.");
  }

  const gaps: string[] = [];
  if (!hasNumbers) {
    gaps.push("Все още няма числа: добавете поне една метрика, резултат от пилот или данни за приходи/използване.");
  }
  if (hasPlaceholders) {
    gaps.push("Попълнете оставащите [полета в скоби] преди подаване; оценителите ги възприемат като липсващи доказателства.");
  }
  if (wordCount < 60) {
    gaps.push("Черновата е кратка; развийте най-силното твърдение с доказателства, вместо да добавяте общи фрази.");
  }
  gaps.push("Свържете всяко твърдение с конкретно доказателство: метрика, резултат от пилот, клиент, IP статус или benchmark.");
  program.evaluationCriteria
    .slice(0, 2)
    .forEach((criterion) => gaps.push("Уверете се, че този раздел ясно адресира: " + translateText(criterion, "bg") + "."));

  const focus = program.applicationFocus.slice(0, 2).map((item) => translateText(item, "bg")).join(" и ");
  const tightened = text.replace(/\s+/g, " ").trim();
  const rewrite = [
    tightened,
    focus ? "От гледна точка на оценителя това директно подкрепя " + focus + "; добавете [метрика], за да направите въздействието убедително." : ""
  ]
    .filter(Boolean)
    .join(" ");

  return { strengths, gaps, rewrite };
}
