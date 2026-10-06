# LoL Match Story

Transforma partidas recentes de **League of Legends** em histórias visuais com começo, momentos importantes, impacto e desfecho.

## Direção do produto

Não é um tracker genérico. O foco é explicar **o que aconteceu naquela partida** de forma visual, emocional e compartilhável.

Fluxo principal:

1. usuário informa Riot ID;
2. o frontend consulta o backend gamer já existente;
3. usuário escolhe uma partida recente;
4. a partida é apresentada em capítulos;
5. o resumo pode ser compartilhado.

## Regras obrigatórias

- PT-BR é o idioma principal e fallback;
- English é o segundo idioma;
- monetização preparada por anúncios sem interromper o fluxo principal;
- mobile e desktop;
- atualização automática quando uma nova versão for publicada;
- nenhuma Riot API key no navegador;
- usar o Supabase gamer ZeroTwo.gg já existente;
- nunca usar o `pizzaria-db` para dados gamer.

## Backend

Supabase gamer: `bieihhaobdztjyoweewa`

Edge Function reutilizada:

- `public-lol-profile`

O frontend pede Riot ID e consome apenas o endpoint server-side. Em falha de rede, rate limit ou ausência temporária de dados, mantém fallback demonstrativo claramente identificado.

## Estado atual

**MVP navegável iniciado em 06/10/2026.**

Já contém:

- busca por Riot ID;
- seletor de servidor;
- PT-BR / EN;
- rail de partidas recentes;
- história em 4 capítulos;
- momentos-chave;
- impacto 0–100;
- highlights;
- compartilhamento;
- fallback demo;
- slot de anúncio;
- responsividade;
- atualização automática de versão.

Próximos passos: validar o contrato real de `public-lol-profile`, enriquecer a narrativa com timeline real quando disponível, gerar card PNG e adicionar testes de browser.
