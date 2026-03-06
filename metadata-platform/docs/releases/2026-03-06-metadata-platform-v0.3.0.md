---
title: Metadata Platform v0.3.0
date: 2026-03-06
version: 0.3.0
branch: feature/metadata-platform
---

## Metadata Platform v0.3.0

## Bug Fixes

### Standard Terms List Page (`/standards`)

- **Error state handling**: Added destructive `Alert` component when API requests fail, displaying the error message
- **Type safety**: Removed all 5 `as any` casts by parameterizing `apiClient<Term[]>()` and exporting the `Term` interface from `term-table.tsx`
- **Pagination zero-total**: Fixed "1-0건" display when no results exist; now shows "총 0건"
- **Search debounce**: Added 300ms debounce on search input to prevent excessive API calls on every keystroke
- **Query invalidation**: Replaced `router.refresh()` with TanStack Query `invalidateQueries` in `TermForm` so the list page shows fresh data after create/update
- **Skeleton loading**: Replaced plain-text "로딩 중..." with a shimmer skeleton table matching the 7-column layout

## New Files

- `src/hooks/use-debounce.ts` — Reusable generic debounce hook
- `src/components/standard/term-table-skeleton.tsx` — Skeleton loading component for the term table

## Modified Files

- `src/app/(dashboard)/standards/page.tsx` — Error state, typed query, debounce integration, skeleton
- `src/components/standard/term-table.tsx` — Exported `Term` interface
- `src/components/shared/data-table-pagination.tsx` — Handle `total=0` early return
- `src/components/standard/term-form.tsx` — Query invalidation after save
