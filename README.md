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

- `public-lol-profile`\n- `public-lol-match-story` — timeline Match-V5, ponto de virada e fluxo de ouro

O frontend pede Riot ID e consome apenas o endpoint server-side. Em falha de rede, rate limit ou ausência temporária de dados, mantém fallback demonstrativo claramente identificado.

## Estado atual

**LoL Match Story 1.0: desenvolvimento principal concluído e publicado.** A auditoria final de 09/10/2026 confirmou dados reais da Riot, segurança do backend e corrigiu o isolamento de cache do PWA. O produto entra em **beta controlado**, mantendo apenas validação humana e anúncios como pendências externas. Consulte o [relatório técnico de lançamento 1.0](RELEASE_V1.md).

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

Contrato real de `public-lol-profile` validado em 06/10/2026. O frontend agora usa sinais reais como dano/min, participação, first blood, multi-kills, spree, objetivos, torres e visão para classificar o arquétipo da partida e enriquecer a narrativa. Card PNG e cobertura E2E também foram adicionados. A timeline real do Match-V5 já está integrada. O projeto também possui ponto de virada por swing de ouro, capítulos variáveis, comparação por modo, histórico local, cards sociais em múltiplos formatos, PWA e GitHub Pages com smoke test. O backlog atualizado está em `IMPLEMENTATION_STATUS.md`.


## Conta padrão de teste
- Riot ID: `AlchemyFlames#BR1`
- Plataforma: `br1`
- Região Match-V5: `americas`
- A conta é usada apenas para validação funcional; a Riot API key continua somente no backend.


## Estado atual do MVP 1.0
- timeline Match-V5 real e ponto de virada;
- Arena com janelas de combate detectadas pela timeline;
- histórias públicas persistentes;
- links sociais com Open Graph dinâmico via `public-lol-story-page`;
- recordes persistentes e coleção de 30 dias;
- feedback anônimo estruturado para validação com usuários;
- acessibilidade com axe-core no CI;
- anúncios desligados por padrão e carregados somente após configuração + consentimento.

O núcleo técnico do MVP 1.0 está encerrado. A partir daqui, novas features ficam congeladas até existir feedback real, bug P0/P1, requisito de segurança/compliance ou evidência clara de uso. Permanecem como validação pós-MVP: testar mais Riot IDs/regiões reais, coletar feedback de usuários e ativar AdSense somente quando houver credenciais/aprovação definitivas.


## Política pós-MVP

- **Status:** MVP 1.0 concluído tecnicamente / validação.
- Não adicionar novas features por refinamento visual ou conveniência sem evidência de necessidade.
- Priorizar apenas bugs P0/P1, segurança, regressões, compatibilidade Riot e feedback real.
- AdSense é dependência externa e não bloqueia o encerramento técnico do MVP.
- A rodada humana com Riot IDs adicionais é validação de produto, não implementação pesada.
