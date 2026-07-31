# Gliker Expanded font files

Place legally licensed files in this directory using these exact names:

- `Gliker-Expanded-Regular.woff2`
- `Gliker-Expanded-SemiBold.woff2`
- `Gliker-Expanded-Bold.woff2`
- `Gliker-Expanded-Black.woff2`

Until those files are supplied, SkillPilot uses the configured rounded fallback stack. The repository intentionally does not download, fabricate, or redistribute the commercial font.

After adding the files, register them with `next/font/local` in `src/config/fonts.ts`, expose the result through `--font-gliker`, and replace the first value of `--font-display-family` in `src/app/globals.css` with `var(--font-gliker)`.
