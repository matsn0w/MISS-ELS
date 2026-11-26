# MISS-ELS web

Built with [Nuxt 4](https://nuxt.com) and [Tailwind CSS 4](https://tailwindcss.com). Requires Node.js 22 or newer.

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build
```

Locally preview production build:

```bash
# npm
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Quality checks

```bash
# lint (ESLint) and format (Prettier)
npm run lint
npm run format

# type-check the app, the tests and the configs
npm run typecheck

# build the site and run the Playwright browser tests
npx playwright install chromium
npm test
```

The same checks run in CI on every pull request, and again on merges to
`main` before the site is deployed.
