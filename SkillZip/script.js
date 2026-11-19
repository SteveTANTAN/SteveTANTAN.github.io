"use strict";

// These interactions illustrate the paper; they do not run the SkillZip system.
const graphStage = document.querySelector(".graph-stage");
const graphCaption = document.getElementById("graph-caption");
const svgNS = "http://www.w3.org/2000/svg";
const rawNodes = document.getElementById("raw-nodes");
[104, 194, 284].forEach((y) => {
  ["Load", "Normalize", "Check"].forEach((label, i) => {
    const x = 158 + i * 79;
    const group = document.createElementNS(svgNS, "g");
    group.setAttribute("class", "raw-node");
    const rect = document.createElementNS(svgNS, "rect");
    Object.entries({ x, y: y - 18, width: 66, height: 36, rx: 7 }).forEach(
      ([key, value]) => rect.setAttribute(key, value),
    );
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", x + 33);
    text.setAttribute("y", y + 4);
    text.setAttribute("text-anchor", "middle");
    text.textContent = label;
    group.append(rect, text);
    rawNodes.append(group);
  });
});
document.querySelectorAll("[data-graph]").forEach((button) => {
  button.addEventListener("click", () => {
    const compressed = button.dataset.graph === "compressed";
    graphStage.dataset.state = button.dataset.graph;
    document
      .querySelectorAll("[data-graph]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    document
      .querySelector(".raw-content")
      .setAttribute("aria-hidden", String(compressed));
    document
      .querySelector(".compressed-content")
      .setAttribute("aria-hidden", String(!compressed));
    document.getElementById("graph-title").textContent = compressed
      ? "Shared procedures, compressed into reusable macros"
      : "Repeated procedures across original skill packages";
    graphCaption.textContent = compressed
      ? "Shared routines become reversible macros. Each verifier stays connected."
      : "Compatible loading, normalization, and checking routines recur across skills.";
  });
});

const methods = {
  sec2graph: {
    tag: "SOURCE-GROUNDED REPRESENTATION",
    title: "Make the procedure visible.",
    description:
      "Split each skill into typed sections: inputs, operations, preconditions, verifiers, and outputs. Connect them through procedural dependencies while retaining pointers to the source.",
    takeaway: "The reusable unit is an executable section graph.",
    image: "./assets/sec2graph.webp",
    caption: "Source-grounded sections form an executable graph.",
    alt: "Skill documents separate into typed inputs, operations, guards, and verifier nodes, with provenance connections back to the source.",
  },
  motifzip: {
    tag: "CONTRACT-PRESERVING COMPRESSION",
    title: "Reuse a routine. Keep its contract.",
    description:
      "Find recurring section-level motifs with compatible interfaces. Replace valid occurrences with ported macros only when dependencies remain closed and verifiers stay reachable.",
    takeaway: "A macro is a reversible graph rewrite, with recoverable source.",
    image: "./assets/motifzip.webp",
    caption: "Recurring motifs become macros with explicit ports.",
    alt: "Repeated teal, white, and lilac procedural motifs are packed into a translucent macro with external ports and a connected verifier.",
  },
  pathhydrate: {
    tag: "BUDGETED EXECUTABLE CONTEXT",
    title: "Reveal only the detail a task needs.",
    description:
      "Anchor the task to relevant sections, close required dependencies, and repair missing execution roles. Render macros at the lowest sufficient detail, expanding them when execution requires it.",
    takeaway: "Context stays compact, dependency-closed, and expandable.",
    image: "./assets/pathhydrate.webp",
    caption: "Expand only the detail needed for the current task.",
    alt: "A compact macro progressively reveals its boundary contract, a short outline, and a complete highlighted executable path.",
  },
  rezip: {
    tag: "EXECUTION-AWARE MAINTENANCE",
    title: "Let the library keep learning.",
    description:
      "Match incoming skills against existing macros and promote new recurring motifs. Use execution traces to refine hydration, split incompatible routines, or retire risky abstractions.",
    takeaway:
      "Maintain reusable procedures as skills and execution evidence evolve.",
    image: "./assets/rezip.webp",
    caption: "New skills and execution evidence refine the library.",
    alt: "New skill documents add a compatible branch to an existing graph while a feedback loop of execution traces guides refinement.",
  },
};
const tabs = [...document.querySelectorAll("[data-method]")];
function showMethod(button) {
  const method = methods[button.dataset.method];
  tabs.forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab === button));
    tab.tabIndex = tab === button ? 0 : -1;
  });
  document
    .getElementById("method-panel")
    .setAttribute("aria-labelledby", button.id);
  ["tag", "title", "description", "takeaway"].forEach((key) => {
    document.getElementById(`method-${key}`).textContent = method[key];
  });
  const illustration = document.getElementById("method-illustration");
  illustration.src = method.image;
  illustration.alt = method.alt;
  document.getElementById("method-caption").textContent = method.caption;
}
tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => showMethod(tab));
  tab.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      tabs[next].focus();
      showMethod(tabs[next]);
    }
  });
});
showMethod(tabs[0]);
// Warm the small WebP assets so tab switches do not wait on image downloads.
Object.values(methods).forEach(({ image }) => {
  const preload = new Image();
  preload.src = image;
});

// Paper Table 1. Scores are task reward (%) or episode success rate (%).
const scores = {
  minimax: {
    skillsbench: [17.2, 10.4, 18.7, 27.3, 33.3],
    alfworld: [47.1, 50.7, 54.3, 67.1, 79.3],
  },
  codex: {
    skillsbench: [27.4, 21.5, 34.4, 36.8, 43.0],
    alfworld: [89.3, 92.9, 93.6, 93.6, 96.4],
  },
};
const methodNames = [
  "Vanilla Skills",
  "Vector Skills",
  "GoS",
  "SkillDAG",
  "SkillZip",
];
const chart = document.getElementById("result-chart");
let benchmark = "alfworld";
methodNames.forEach((name, index) => {
  const row = document.createElement("div");
  row.className = `bar-row${index === 4 ? " ours" : ""}`;
  row.innerHTML =
    '<span class="bar-label"></span><div class="bar-track"><div class="bar-fill"></div></div><span class="bar-value"></span>';
  row.querySelector(".bar-label").textContent = name;
  chart.append(row);
});
function updateResults() {
  const backbone = document.getElementById("backbone");
  const values = scores[backbone.value][benchmark];
  const benchmarkName = benchmark === "alfworld" ? "ALFWorld" : "SkillsBench";
  const metric =
    benchmark === "alfworld" ? "Episode success rate" : "Task reward";
  document.getElementById("chart-title").textContent = metric;
  chart.querySelectorAll(".bar-row").forEach((row, index) => {
    row.querySelector(".bar-fill").style.width = `${values[index]}%`;
    row.querySelector(".bar-value").textContent = values[index].toFixed(1);
  });
  chart.setAttribute(
    "aria-label",
    `${benchmarkName} ${metric.toLowerCase()}, ${backbone.selectedOptions[0].textContent}: ${methodNames.map((name, index) => `${name} ${values[index].toFixed(1)}%`).join(", ")}.`,
  );
  document.getElementById("chart-summary").innerHTML =
    `<strong>+${(values[4] - values[3]).toFixed(1)} points</strong> over SkillDAG on ${benchmarkName}.`;
}
document.querySelectorAll("[data-benchmark]").forEach((button) => {
  button.addEventListener("click", () => {
    benchmark = button.dataset.benchmark;
    document
      .querySelectorAll("[data-benchmark]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    updateResults();
  });
});
document.getElementById("backbone").addEventListener("change", updateResults);
updateResults();

const dialog = document.getElementById("figure-dialog");
document
  .querySelectorAll("#expand-figure, .figure-button")
  .forEach((button) =>
    button.addEventListener("click", () => dialog.showModal()),
  );
document
  .getElementById("close-figure")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  }
});

let copyTimer;
document.getElementById("copy-citation").addEventListener("click", async () => {
  const button = document.getElementById("copy-citation");
  const text = document.getElementById("bibtex").textContent;
  const status = document.getElementById("copy-status");
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(text);
    button.querySelector("span").textContent = "Copied!";
    status.textContent = "Citation copied to clipboard.";
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.getElementById("bibtex"));
    selection.removeAllRanges();
    selection.addRange(range);
    button.querySelector("span").textContent = "Select & copy";
    status.textContent =
      "Automatic copy is unavailable. The citation is selected; press Control+C or Command+C to copy.";
  }
  copyTimer = setTimeout(() => {
    button.querySelector("span").textContent = "Copy citation";
  }, 3000);
});

if ("IntersectionObserver" in window) {
  const links = [...document.querySelectorAll(".nav-links a")];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting)
          links.forEach((link) => {
            const active = link.hash === `#${entry.target.id}`;
            link.classList.toggle("active", active);
            if (active) link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
      });
    },
    { rootMargin: "-15% 0px -55% 0px" },
  );
  links.forEach((link) => observer.observe(document.querySelector(link.hash)));
}
