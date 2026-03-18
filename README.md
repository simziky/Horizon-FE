This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Week 1 Baseline Metrics (Lighthouse CI)

This project includes a local Lighthouse CI setup to baseline performance metrics across public and authenticated routes.

### Setup

1. Create a local `.env.lighthouse` from the example:

```bash
cp .env.lighthouse.example .env.lighthouse
```

2. Fill in `LHCI_EMAIL` and `LHCI_PASSWORD` in `.env.lighthouse`.
3. Start the app:

```bash
npm run dev
```

4. Run the baseline:

```bash
npm run lhci:baseline
```

You can also run one device only:

```bash
npm run lhci:baseline:mobile
npm run lhci:baseline:desktop
```

### Output

Reports are written to:

- `lighthouse/reports/mobile/` (HTML + JSON + manifest)
- `lighthouse/reports/desktop/` (HTML + JSON + manifest)

### Export Lighthouse Results to DOCX

After generating reports, create a Word document summary table with:

```bash
npm run lhci:docx
```

This reads both manifests and writes:

- `lighthouse/reports/lighthouse-summary.docx`

### Notes

- The login script uses `LHCI_LOGIN_URL` (defaults to `/`) and submits the login form.
- If your account is redirected to signup steps, Lighthouse may record those pages instead of the dashboard.
