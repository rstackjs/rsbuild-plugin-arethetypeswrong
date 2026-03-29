# Agent Guidelines for rsbuild-plugin-arethetypeswrong

This repository contains `rsbuild-plugin-arethetypeswrong`, a plugin for checking TypeScript type definitions using `@arethetypeswrong/core` in Rsbuild/Rslib. When making changes to this codebase, you must adhere to the following rules and commands.

## 🏗️ Build & Development Commands

This project uses `pnpm` (version 10+) as its package manager. Always use `pnpm` instead of `npm` or `yarn`.

- **Install Dependencies:** `pnpm install`
- **Build the Plugin:** `pnpm build` (Runs `rslib build` under the hood)

The plugin is built as an ESM package. Pay attention to `.js` vs `.ts` extensions in internal imports. Since the project has `"type": "module"` and `moduleResolution: node16` in `tsconfig.json`, local imports in source files must include the `.js` extension (e.g., `import "./createTarball.js"`).

## 🧪 Testing

We use [Vitest](https://vitest.dev/) for testing. Tests are located in the `test/` directory.

- **Run All Tests:** `pnpm test`
- **Run Tests with Coverage:** `vitest --coverage`
- **Run a Single Test:** `vitest test/path-to-test/index.test.ts`
- **Update Snapshots:** `vitest -u`

**Testing Guidelines:**

- Most tests are integration tests that create an Rsbuild instance with the plugin and check the output.
- Assertions typically involve spying on `logger.success` or `logger.error`, filtering the messages for `[arethetypeswrong]`, stripping VT control characters, and running snapshot tests (`toMatchSnapshot()`).
- Use Vitest's `vi.spyOn(logger, "...")` to capture console outputs.

## 🧹 Linting & Formatting

- **Linting:** We use `rslint` (powered by `@typescript-eslint` via `rslint.jsonc`).
  - Command: `pnpm lint`
- **Formatting:** We use `dprint` for highly-performant code formatting.
  - Command: `npx dprint fmt` (or let `nano-staged` handle it on commit)
- **Code standards:** Never leave unused variables, imports, or dead code. `rslint` enforces these rules strictly.

## 🎨 Code Style & Conventions

- **Node Modules:** Always use the `node:` prefix when importing core Node.js modules (e.g., `import fs from "node:fs"`).
- **TypeScript Types:**
  - Strictly separate type imports with `import type { ... } from "..."`.
  - Prefer `interface` over `type` for object shapes, except for unions and complex utility types.
  - Enable and respect strict TypeScript checks. We compile with `"strict": true`, `"erasableSyntaxOnly": true`, and `"verbatimModuleSyntax": true`.
- **Naming Conventions:**
  - `camelCase` for functions, methods, and variables.
  - `PascalCase` for classes, interfaces, and type aliases.
- **Error Handling & Logs:**
  - Use `logger` from `@rsbuild/core` instead of `console.log`.
  - Prefix plugin logs with `[arethetypeswrong]`.
- **Coverage:** If a piece of code shouldn't be covered by tests (like `isWatch` conditions), use coverage ignore comments: `/* node:coverage ignore next -- @preserve */`.

## 📂 Architecture

- `src/index.ts` is the main entry point where the Rsbuild plugin is defined (`pluginAreTheTypesWrong`).
- `src/render/` contains logic for formatting the problem summaries into readable terminal output.
- `src/createTarball.ts` packages the current project into a temporary tarball to simulate what is published to npm, feeding it to `@arethetypeswrong/core`.
- `test/` contains different testing scenarios checking various package structures and module modes.

Always ensure the code remains performant by leveraging async/await and lazy loading where appropriate (e.g., dynamically importing `@arethetypeswrong/core` only when needed, as it can be large).
