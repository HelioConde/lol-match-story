# Fullstack — LoL Match Story

## Produto
Experiência narrativa pós-partida de League of Legends. O objetivo é explicar **o que aconteceu e por quê**, não reproduzir um tracker tradicional.

## Frontend
HTML/CSS/JS estático em GitHub Pages.

Recursos:
- Riot ID + servidor;
- PT-BR principal e EN;
- rail de partidas;
- capítulos narrativos;
- timeline real quando disponível;
- Arena com janelas reais de combate detectadas;
- comparação por modo;
- resumo de sessão;
- recordes persistentes e coleção mensal de histórias publicadas;
- itens, runas e feitiços Data Dragon;
- PNG 4:5 / 9:16 / 1:1;
- PWA;
- histórico local;
- estados de loading/erro/fallback;
- feedback anônimo estruturado;
- ads configuráveis, consent-gated e desligados por padrão.

## Backend
Supabase gamer ZeroTwo.gg: `bieihhaobdztjyoweewa`.

### `public-lol-profile`
Perfil e partidas normalizadas.

### `public-lol-match-story`
Eventos derivados do Match-V5 Timeline:
- first blood;
- kills/assists/deaths;
- objetivos e estruturas;
- multi-kills;
- fluxo de ouro;
- maior swing;
- ponto de virada;
- janelas de combate de Arena detectadas por clusters de eliminações.

### `public-lol-story`
- publica snapshot seguro;
- recupera história pública por match;
- calcula recordes persistentes;
- retorna coleção dos últimos 30 dias.

### `public-lol-story-page`
Entrega HTML com Open Graph/Twitter dinâmico e redireciona para a história no GitHub Pages.

### `public-lol-feedback`
Recebe somente:
- match ID;
- útil / não útil;
- motivo fechado opcional;
- contexto e locale.

Não recebe nome, e-mail ou texto livre.

## Segurança
- Riot API key somente em Edge Functions;
- `lol_timeline_cache`, `lol_public_stories` e `lol_story_feedback` com RLS;
- acesso direto de `anon` e `authenticated` revogado;
- `service_role` recebe apenas permissões necessárias às Edge Functions;
- publicação valida que o match pertence ao Riot ID consultado.

## QA
- Static QA;
- Browser E2E;
- axe-core WCAG;
- Live Update QA;
- GitHub Pages deploy/smoke;
- Live Riot Data Smoke com `AlchemyFlames#BR1`.

## Monetização
`ads-config.js` mantém IDs vazios por padrão. `ads.js` somente carrega provedor externo quando existe configuração real e consentimento local.

## Deploy
`main` → GitHub Actions → GitHub Pages.

URL:
`https://helioconde.github.io/lol-match-story/`
