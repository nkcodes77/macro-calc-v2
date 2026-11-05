# Macro Calc

Personal calorie and protein tracker with a pantry-aware meal finder, installed on iPhone as a home-screen app.

Live: https://nkcodes77.github.io/macro-calc-v2/

## Develop

```sh
npm install
npm run dev        # http://localhost:5173/macro-calc-v2/
npm run check      # everything CI runs except end-to-end
npx playwright install webkit   # once
npm run e2e
```

## Ship

Push to `main`. GitHub Actions runs typecheck, lint, format, unit tests with coverage, build, a bundle size budget and
end-to-end tests on WebKit, then deploys to GitHub Pages. A failing check blocks the deploy.

Project rules for people and agents are in `CLAUDE.md`. Specialist agents are in `.claude/agents/`.
