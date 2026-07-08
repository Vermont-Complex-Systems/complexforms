# Pages — the non-story content

Pages are everything with Nav and Footer: home, about, and whatever the site grows. They live in the `(app)` route group and use the `.page` container (centered, width-constrained); stories deliberately have neither. The exact routes, file names, and wiring live in the MCP's `project-structure` section — fetch it before touching pages; this file carries only the craft.

## The principles

- **Start with the home page.** It is ordinary user-owned Svelte, styled with `.page` and tokens. Most "customize the site" requests are just editing it; don't invent new machinery for the easy case. When the request names a quality rather than a change, the work is elicitation, not guessing — SKILL.md's "Elicit, don't fill in" has the moves. And put the styles where their reach is: site-wide look changes are token overrides in `src/lib/styles/app.css`; styling for one page stays in that component's `<style>` block (the full rule is in SKILL.md's token section).
- **Listings follow the CSV-registry pattern.** When the user wants a page of *things* (members, publications, datasets), the templates model one reusable shape: a CSV registry as the single source of truth, a grid of cards over its rows, and optional prerendered detail routes. The wiring (remote function, `svelte.config.js` prerender entries, the traps) is in `project-structure`. The craft: the CSV stays the source of truth — edit a row, the site follows; never hardcode cards in markup.
- **Pages are site-shaping, so the gate applies with extra force.** Adding a members page changes what the site *is*. "We are a lab" does not imply "build /about/members". Propose the page and its registry, show one card's worth of layout, and get a yes — the same propose/confirm/build loop as stories.
- **Content comes from the user.** Bios, titles, and publication lists are theirs to provide; don't fabricate placeholder people beyond what the template ships.
