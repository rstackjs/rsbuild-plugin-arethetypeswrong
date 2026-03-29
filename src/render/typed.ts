/**
 * @license
Copyright 2023 Andrew Branch

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import type * as core from "@arethetypeswrong/core";
import {
  filterProblems,
  problemAffectsEntrypoint,
  problemAffectsResolutionKind,
  problemKindInfo,
} from "@arethetypeswrong/core/problems";
import { allResolutionKinds, getResolutionOption, groupProblemsByKind } from "@arethetypeswrong/core/utils";
import Table from "cli-table3";
import color from "picocolors";

import { moduleKinds, problemFlags, resolutionKinds } from "../problemUtils.js";
import type { RenderOptions } from "./index.js";

export function renderTyped(
  analysis: core.Analysis,
  { emoji = true, summary = true, ignoreRules = [], ignoreResolutions = [] }: RenderOptions,
): string {
  let output = "";
  const problems = analysis.problems.filter(
    (problem) => !ignoreRules || !ignoreRules.includes(problemFlags[problem.kind]),
  );
  // sort resolutions with required (impacts result) first and ignored after
  const requiredResolutions = allResolutionKinds.filter((kind) => !ignoreResolutions.includes(kind));
  const ignoredResolutions = allResolutionKinds.filter((kind) => ignoreResolutions.includes(kind));
  const resolutions = requiredResolutions.concat(ignoredResolutions);
  const entrypoints = Object.keys(analysis.entrypoints);

  out(`[arethetypeswrong] ${analysis.packageName} v${analysis.packageVersion}`);
  out();
  if (Object.keys(analysis.buildTools).length) {
    out("Build tools:");
    out(
      Object.entries(analysis.buildTools)
        .map(([tool, version]) => {
          return `- ${tool}@${version}`;
        })
        .join("\n"),
    );
    out();
  }

  if (ignoreRules && ignoreRules.length) {
    out(color.gray(` (ignoring rules: ${ignoreRules.map((rule) => `'${rule}'`).join(", ")})\n`));
  }
  if (ignoreResolutions && ignoreResolutions.length) {
    out(
      color.gray(` (ignoring resolutions: ${ignoreResolutions.map((resolution) => `'${resolution}'`).join(", ")})\n`),
    );
  }

  if (summary) {
    const defaultSummary = !emoji ? " No problems found" : " No problems found 🌟";
    const grouped = groupProblemsByKind(problems);
    const summaryTexts = Object.entries(grouped).map(([kind, kindProblems]) => {
      const info = problemKindInfo[kind as core.ProblemKind];
      const affectsRequiredResolution = kindProblems.some((p) =>
        requiredResolutions.some((r) => problemAffectsResolutionKind(p, r, analysis))
      );

      let description = `${info.description}${
        info.details ? ` Use \`-f json\` to see ${info.details}.` : ""
      } ${info.docsUrl}`;

      // Simple markdown replacement for terminal readability
      description = description
        // Inline code blocks (e.g., `code`) -> highlighted code
        .replace(/`([^`]+)`/g, (_: string, code: string) => color.cyan(code))
        // Links (e.g., [text](url)) -> text (url)
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          (_: string, text: string, url: string) => `${color.bold(text)} (${color.blue(color.underline(url))})`,
        );

      return `${affectsRequiredResolution ? "" : "(ignored per resolution) "}${
        emoji ? `${info.emoji} ` : ""
      }${description}\n\n`;
    });

    out(summaryTexts.join("") || defaultSummary);
  }

  const entrypointNames = entrypoints.map(
    (s) => `"${s === "." ? analysis.packageName : `${analysis.packageName}/${s.substring(2)}`}"`,
  );
  const entrypointHeaders = entrypoints.map((s, i) => {
    const hasProblems = problems.some((p) => problemAffectsEntrypoint(p, s, analysis));
    return color.bold((hasProblems ? color.redBright : color.greenBright)(entrypointNames[i]));
  });

  const getCellContents = (subpath: string, resolutionKind: core.ResolutionKind) => {
    const ignoredPrefix = ignoreResolutions.includes(resolutionKind) ? "(ignored) " : "";
    const problemsForCell = groupProblemsByKind(
      filterProblems(problems, analysis, { entrypoint: subpath, resolutionKind }),
    );
    const entrypoint = analysis.entrypoints[subpath].resolutions[resolutionKind];
    const resolution = entrypoint.resolution;
    const kinds = Object.keys(problemsForCell) as core.ProblemKind[];
    if (kinds.length) {
      return kinds
        .map(
          (kind) =>
            ignoredPrefix + (emoji ? `${problemKindInfo[kind].emoji} ` : "") + problemKindInfo[kind].shortDescription,
        )
        .join("\n");
    }

    const jsonResult = !emoji ? "OK (JSON)" : "🟢 (JSON)";
    const moduleResult = entrypoint.isWildcard
      ? "(wildcard)"
      : (!emoji ? "OK " : "🟢 ")
        + moduleKinds[
          analysis.programInfo[getResolutionOption(resolutionKind)].moduleKinds?.[resolution?.fileName ?? ""]
            ?.detectedKind || ""
        ];
    return ignoredPrefix + (resolution?.isJson ? jsonResult : moduleResult);
  };

  const table = new Table({
    head: ["", ...entrypointHeaders],
  });
  resolutions.forEach((kind) => {
    table.push([resolutionKinds[kind], ...entrypoints.map((entrypoint) => getCellContents(entrypoint, kind))]);
  });
  out(table.toString());

  return output.trimEnd();

  function out(s = "") {
    output += s + "\n";
  }
}
