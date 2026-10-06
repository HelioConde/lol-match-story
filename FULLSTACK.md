# Fullstack — LoL Match Story

## Produto
Experiência narrativa pós-partida de League of Legends. O objetivo é explicar **o que aconteceu e por quê**, não reproduzir um tracker tradicional.

## Frontend
HTML/CSS/JS estático publicado em GitHub Pages.

Recursos atuais:
- Riot ID + servidor;
- PT-BR principal e EN;
- rail de partidas;
- capítulos narrativos e capítulo opcional de ponto de virada;
- comparação com partidas do mesmo modo;
- resumo de sessão;
- itens, runas e feitiços via Data Dragon;
- link compartilhável e PNG 4:5 / 9:16 / 1:1;
- PWA;
- histórico local;
- estados de loading/erro/fallback;
- métricas locais sem terceiros.

## Backend
Supabase gamer ZeroTwo.gg: `bieihhaobdztjyoweewa`.

### `public-lol-profile`
Fornece perfil e partidas normalizadas.

### `public-lol-match-story`
Fornece eventos derivados do Match-V5 Timeline:
- first blood real quando o jogador participou;
- kills/assists/deaths;
- objetivos e estruturas;
- multi-kills;
- fluxo de ouro por fase;
- maior swing de ouro;
- ponto de virada.

A função só consulta timeline de partidas já presentes no cache e associadas ao jogador consultado. A Riot API key nunca chega ao browser.

### Cache
`lol_timeline_cache`:
- RLS ativo;
- acesso direto revogado para `anon` e `authenticated`;
- service role usado apenas pela Edge Function;
- timeline de partida concluída cacheada por 30 dias.

## QA
- Static QA;
- Browser E2E;
- Live Update QA;
- GitHub Pages deploy;
- GitHub Pages smoke;
- Live Riot Data Smoke usando `AlchemyFlames#BR1`.

## Deploy
`main` → GitHub Actions → GitHub Pages.

URL:
`https://helioconde.github.io/lol-match-story/`

## Próximos itens estruturais
1. persistir histórias públicas;
2. página dedicada/metadata dinâmica por match;
3. recordes históricos permanentes;
4. WCAG completo;
5. validação com usuários reais.

Veja `IMPLEMENTATION_STATUS.md` para o status dos 40 itens.
