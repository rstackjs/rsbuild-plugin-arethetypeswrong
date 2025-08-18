import fs from "node:fs/promises";
import path from "node:path";

import { detect } from "package-manager-detector";
import { x } from "tinyexec";

interface Result extends AsyncDisposable {
  path: string;
}

export async function createTarball(
  root: string,
  pkg: { name: string; version: string },
): Promise<Result> {
  const tarballPath = path.join(
    root,
    `${normalizeNpmPackageName(pkg.name)}-${pkg.version}.tgz`,
  );

  const detectResult = await detect({ cwd: root });

  const [command, args] = (function(): [string, string[]] {
    switch (detectResult?.agent) {
      case "yarn":
        // https://classic.yarnpkg.com/lang/en/docs/cli/pack/
        return ["yarn", ["pack", "--filename", tarballPath]];
      case "yarn@berry":
        // https://yarnpkg.com/cli/pack
        return ["yarn", ["pack", "--out", tarballPath]];
      case "npm":
      case "bun":
      case "deno":
      case undefined:
        return ["npm", ["pack"]];
      case "pnpm":
      case "pnpm@6":
        return ["pnpm", ["pack"]];
    }
  })();

  await x(command, args, {
    nodeOptions: {
      cwd: root,
    },
  });

  return {
    path: tarballPath,
    async [Symbol.asyncDispose]() {
      return fs.unlink(tarballPath);
    },
  };
}

function normalizeNpmPackageName(name: string): string {
  return name.replaceAll("@", "").replaceAll("/", "-");
}
