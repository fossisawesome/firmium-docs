# firmium-docs

[![Sponsor on GitHub](https://img.shields.io/badge/sponsor-%E2%9D%A4-db61a2?logo=githubsponsors)](https://github.com/sponsors/fossisawesome)

Docs for [Firmium](https://github.com/fossisawesome/firmium), built with Vite + Svelte and deployed to GitHub Pages.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Docs content lives in `src/content/*.md` and is rendered by `src/lib/Markdown.svelte`.

## Self-hosting with Docker

Download [docker-compose.yml](docker-compose.yml) and run:

```bash
docker compose up -d
```

This pulls the prebuilt image from `ghcr.io/fossisawesome/firmium-docs` and serves it via nginx on `http://localhost:8080`. To use a different port, edit `docker-compose.yml`.

Without compose:

```bash
docker run -d -p 8080:80 ghcr.io/fossisawesome/firmium-docs:latest
```

To build the image yourself instead of using the published one, clone this repo and run `docker build -t firmium-docs .`.
