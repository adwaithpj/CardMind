# Thinking — `border-border` Tailwind build failure (2026-04-09)

## Symptom

Next.js dev server reported a PostCSS/Tailwind syntax error on `src/app/globals.css` at `@tailwind base`, with the message that the class **`border-border`** does not exist.

## Diagnosis

1. In `@layer base`, the file applies shadcn-style utilities: `@apply border-border`, `bg-background`, `text-foreground`.
2. Those utilities only exist if Tailwind’s theme defines semantic color names (`border`, `background`, `foreground`, …) that map to the CSS variables already declared in `:root` (`--border`, `--background`, …).
3. `tailwind.config.ts` extended `colors` with `brand`, `success`, `warning`, and `danger` only. It did **not** register `border`, `background`, or `foreground`, so Tailwind could not generate `border-border` (border color = `border`) or the other semantic classes.

## Fix

Extend `theme.extend` in `tailwind.config.ts` with the standard HSL mappings used by shadcn/ui:

- `border`, `input`, `ring`, `background`, `foreground`
- Nested tokens: `primary`, `secondary`, `destructive`, `muted`, `accent`, `popover`, `card` (each with `DEFAULT` + `foreground` where applicable)

Also add `borderRadius.lg|md|sm` tied to `var(--radius)` so `rounded-lg` etc. stay consistent with `--radius` in `globals.css`.

## Verification

`npm run build` completed with exit code 0; CSS compiled without the previous PostCSS error.

## Lesson

If `globals.css` uses `@apply` with semantic tokens (`border-border`, `bg-background`, …), the Tailwind config must declare those theme keys. Copying CSS variables alone is not enough — the config is what makes `@apply` resolve.
