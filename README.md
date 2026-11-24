# Starmon Quest

Chapter 1 hub prototype for the new Starmon Quest game. The supplied game mechanics document is the source of truth for the current route, trainer-name, encounter, and UI data.

## Run locally

1. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
2. Run `npm install`.
3. Run `npm run dev`.

## Current scope

- Main hub layout and Chapter 1's five quests / thirty rounds.
- Trainer roster names, named thug/challenger rounds, and Day / Night / Rain / INSCENTED encounter lists.
- Guest story position in local storage; authenticated story position and account profile through Supabase.
- Core calculations from the document in `src/game/mechanics.ts`: damage, tie-breaking, EXP, level-up stat points, Mcap caps, and two-stage encounter selection.
- Supabase migration for player persistence is in `supabase/migrations`.

The mechanics file does not define per-round trainer teams, starter selection, item identities, or battle setup values. Those portions are intentionally left unimplemented pending source data; this prototype does not generate battles or alter the supplied encounter odds.

