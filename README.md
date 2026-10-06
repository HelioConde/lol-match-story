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

Contrato real de `public-lol-profile` validado em 06/10/2026. O frontend agora usa sinais reais como dano/min, participação, first blood, multi-kills, spree, objetivos, torres e visão para classificar o arquétipo da partida e enriquecer a narrativa. Card PNG e cobertura E2E também foram adicionados. Próximo passo: consumir eventos reais do Match-V5 Timeline para substituir os timestamps heurísticos.


## Conta padrão de teste
- Riot ID: `AlchemyFlames#BR1`
- Plataforma: `br1`
- Região Match-V5: `americas`
- A conta é usada apenas para validação funcional; a Riot API key continua somente no backend.
