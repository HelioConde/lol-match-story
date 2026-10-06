# Fullstack — LoL Match Story

## Produto
Experiência narrativa pós-partida de League of Legends.

## Frontend
Aplicação estática em HTML/CSS/JS, pronta para GitHub Pages. A interface prioriza splash art, capítulos, timeline e cards em vez de tabelas técnicas.

## Backend
Reutiliza o Supabase gamer ZeroTwo.gg (`bieihhaobdztjyoweewa`). A Riot API key permanece exclusivamente em Edge Functions.

Integração inicial: `public-lol-profile`.

## Dados
O MVP aceita respostas com `matches`, `recentMatches` ou `data.matches` e normaliza os campos relevantes para a experiência.

## UX/UI
- hero com proposta em uma frase;
- entrada Riot ID sem cadastro;
- histórico horizontal compacto;
- narrativa em quatro capítulos;
- dados técnicos somente como apoio;
- fallback demo sempre rotulado;
- anúncio fora do fluxo crítico.

## Internacionalização
PT-BR padrão + EN com preferência persistida em localStorage.

## QA mínimo
- nenhum segredo no browser;
- falha de API não derruba a página;
- troca de idioma mantém o estado;
- seleção de partida atualiza a história sem reload;
- mobile sem overflow horizontal crítico;
- live update ativo fora de localhost.

## Próxima etapa
1. validar IDs reais contra `public-lol-profile`;
2. mapear exatamente o schema de partidas;
3. derivar eventos reais quando houver timeline;
4. exportar share card PNG;
5. testes E2E.
