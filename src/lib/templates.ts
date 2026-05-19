import type {
  ApplicationPack,
  ApplicationTip,
  EligibilityResult,
  FounderProfile,
  GeneratedDocument,
  Program
} from "./types";

export function buildApplicationTips(program: Program): ApplicationTip[] {
  const tips: ApplicationTip[] = [];
  const lowerTitle = program.title.toLowerCase();

  if (lowerTitle.includes("eic") || program.applicationFocus.includes("Technology readiness level")) {
    tips.push({
      title: "Make the innovation claim specific",
      detail:
        "Avoid broad labels such as AI platform. Name the technical bottleneck, the measurable improvement, and why existing alternatives do not solve it well enough.",
      sourceRequirement: "Evaluation criteria: breakthrough innovation and market disruption",
      sourceUrl: program.officialUrl
    });
    tips.push({
      title: "Explain the risk gap",
      detail:
        "Show why grant or blended finance is needed now by separating technical risk, market risk, regulatory risk, and scale-up risk.",
      sourceRequirement: "Application focus: investor risk gap",
      sourceUrl: program.officialUrl
    });
  }

  if (program.regionType === "Bulgaria") {
    tips.push({
      title: "Prepare cost logic before writing",
      detail:
        "Bulgarian procedures usually reward applications where activities, suppliers, eligible cost categories, and timing are tightly connected.",
      sourceRequirement: "Required documents: budget and cost justification",
      sourceUrl: program.officialUrl
    });
    tips.push({
      title: "Use procedure language for eligibility",
      detail:
        "State SME status, implementation location, project activities, and exclusions plainly so reviewers do not need to infer compliance.",
      sourceRequirement: "Evaluation criteria: national eligibility and procedure compliance",
      sourceUrl: program.officialUrl
    });
  }

  if (program.id.includes("eurostars")) {
    tips.push({
      title: "Make the consortium necessary",
      detail:
        "Do not list partners as decoration. Explain the R&D work each partner uniquely performs and why the project cannot be done as well by one company.",
      sourceRequirement: "Who can apply: international consortium led by an innovative SME",
      sourceUrl: program.officialUrl
    });
  }

  if (program.fundingType.some((type) => type.toLowerCase().includes("accelerator"))) {
    tips.push({
      title: "Show validation early",
      detail:
        "Put customer, pilot, or partner evidence near the beginning. Accelerator reviewers need to see momentum before they read detailed plans.",
      sourceRequirement: "Evaluation criteria: market relevance and product readiness",
      sourceUrl: program.officialUrl
    });
  }

  tips.push({
    title: "Tie every claim to evidence",
    detail:
      "For each major claim, add a proof point: customer quote, pilot metric, prototype result, IP status, revenue signal, partner letter, or technical benchmark.",
    sourceRequirement: `Required documents: ${program.requiredDocuments.slice(0, 3).join(", ")}`,
    sourceUrl: program.officialUrl
  });

  return tips.slice(0, 5);
}

export function buildFallbackPack(
  program: Program,
  profile: FounderProfile,
  eligibility: EligibilityResult
): ApplicationPack {
  const documents = buildDocuments(program, profile);

  return {
    programId: program.id,
    programTitle: program.title,
    generatedAt: new Date().toISOString(),
    aiProvider: "fallback",
    model: "deterministic-template",
    eligibility,
    applicationTips: buildApplicationTips(program),
    documents,
    checklist: buildChecklist(program),
    warning: "Ollama was not available, so GrantForge used deterministic programme-specific templates."
  };
}

function buildDocuments(program: Program, profile: FounderProfile): GeneratedDocument[] {
  const docs: GeneratedDocument[] = [];

  docs.push({
    title: "Project Proposal",
    purpose: `Core proposal structure for ${program.title}.`,
    sections: [
      {
        heading: "Executive summary",
        prompt: `Summarize the startup, project objective, target customer, requested support, and why this programme is a fit for a ${profile.stage || "technology"} company.`,
        programSpecificNotes: [
          `Reference the programme's focus on ${program.applicationFocus.slice(0, 3).join(", ")}.`,
          `Use the official eligibility framing from ${program.provider}.`
        ]
      },
      {
        heading: "Problem and market need",
        prompt: "Describe the customer pain, who pays, how urgent the need is, and what evidence proves demand.",
        programSpecificNotes: ["Include customer validation, pilot evidence, or sales pipeline where possible."]
      },
      {
        heading: "Solution and innovation",
        prompt: "Explain what is technically or commercially new, how it works, and what performance gain it creates.",
        programSpecificNotes: program.applicationFocus.includes("Company-level innovation")
          ? ["Describe the new model introduced in the company and how it differs from current operations."]
          : ["Separate product features from the underlying innovation and evidence."]
      },
      {
        heading: "Implementation plan",
        prompt: "Break the project into activities, outputs, owners, timeline, and milestones.",
        programSpecificNotes: program.regionType === "Bulgaria"
          ? ["Map each activity to eligible cost categories and procurement logic."]
          : ["Connect activities to technical validation, commercialization, or scale-up milestones."]
      }
    ]
  });

  docs.push({
    title: "Budget Justification",
    purpose: "A reviewer-ready explanation of why each cost is necessary and eligible.",
    sections: [
      {
        heading: "Budget overview",
        prompt: "List each budget line, amount, category, supplier or cost basis, and project activity it supports.",
        programSpecificNotes: program.regionType === "Bulgaria"
          ? ["Use ISUN categories and attach supplier or market-price logic early."]
          : ["Separate grant-funded work from investment-funded or self-funded activities."]
      },
      {
        heading: "Eligible cost rationale",
        prompt: "For every cost, explain the necessity, eligibility basis, and expected output.",
        programSpecificNotes: program.eligibleCosts.slice(0, 4)
      },
      {
        heading: "Co-financing and cash flow",
        prompt: "Explain how the company will finance any uncovered costs and manage cash flow.",
        programSpecificNotes: ["Mention revenue, investors, own funds, or partner contributions where relevant."]
      }
    ]
  });

  docs.push({
    title: "Innovation and Technical Feasibility",
    purpose: "Evidence that the technology can be built, validated, and protected.",
    sections: [
      {
        heading: "Technical baseline",
        prompt: "Describe current product maturity, prototype state, TRL or equivalent readiness, and known constraints.",
        programSpecificNotes: ["Add test results, architecture diagrams, benchmark data, or prototype screenshots."]
      },
      {
        heading: "Feasibility work plan",
        prompt: "List experiments, build tasks, pilots, certifications, or integrations needed to de-risk the project.",
        programSpecificNotes: ["Separate R&D from ordinary commercial development."]
      },
      {
        heading: "IP and defensibility",
        prompt: "Explain owned IP, licensed IP, know-how, datasets, regulatory approvals, or other defensibility assets.",
        programSpecificNotes: program.title.toLowerCase().includes("eic")
          ? ["Explain freedom to operate and why the innovation can become a European or global category leader."]
          : ["Show that the applicant has the rights needed to implement the project."]
      }
    ]
  });

  docs.push({
    title: "Market and Go-to-Market Plan",
    purpose: "A commercial plan aligned with the programme's evaluation priorities.",
    sections: [
      {
        heading: "Target customers",
        prompt: "Define customer segments, buyer personas, budgets, procurement behavior, and priority beachhead market.",
        programSpecificNotes: ["Tie the market selection to actual startup traction or pilot access."]
      },
      {
        heading: "Competitive positioning",
        prompt: "Compare direct alternatives, indirect alternatives, and why the startup wins in measurable terms.",
        programSpecificNotes: ["Use quantified differentiation instead of generic claims."]
      },
      {
        heading: "Commercialization milestones",
        prompt: "List channel, pricing, pilot, launch, sales, and partnership milestones over 12 to 36 months.",
        programSpecificNotes: ["Connect milestones to requested funding and evaluator impact criteria."]
      }
    ]
  });

  docs.push({
    title: "Team, Risk, and Milestone Plan",
    purpose: "Execution evidence for evaluators.",
    sections: [
      {
        heading: "Team capability",
        prompt: "Map founders and key hires to technical, market, regulatory, fundraising, and delivery responsibilities.",
        programSpecificNotes: ["Identify gaps and how the grant, accelerator, or investment will close them."]
      },
      {
        heading: "Risk register",
        prompt: "List technical, market, financial, legal, regulatory, and delivery risks with mitigation actions.",
        programSpecificNotes: program.title.toLowerCase().includes("eic")
          ? ["Be explicit about high risk; do not pretend the project is already low risk."]
          : ["Show compliance and implementation risks in practical terms."]
      },
      {
        heading: "Milestones",
        prompt: "Provide measurable milestones, due dates, acceptance criteria, and responsible owners.",
        programSpecificNotes: ["Include evidence deliverables, not only activity completion."]
      }
    ]
  });

  return docs;
}

function buildChecklist(program: Program): string[] {
  return [
    ...program.requiredDocuments,
    "Eligibility evidence file",
    "Budget source notes",
    "Official call document review",
    "Internal review against evaluation criteria",
    "Submission calendar with at least two buffer days"
  ];
}
