# Implementation Status — LoL Match Story

Atualizado em 07/10/2026.

Legenda: ✅ concluído · 🟡 implementado, mas depende de validação/terceiros · ⏳ pendente externo

1. ✅ Match-V5 Timeline real via `public-lol-match-story`, com cache privado.
2. ✅ Ponto de virada automático usando eventos + maior swing de ouro.
3. ✅ Narrativa própria para Summoner's Rift, Arena e ARAM; modos especiais usam fallback contextual.
4. ✅ Arena usa timeline real para detectar janelas de combate; os limites são explicitamente marcados como estimados porque a Riot não fornece evento oficial de início/fim de round.
5. ✅ Card PNG com splash art e formatos 4:5, 9:16 e 1:1.
6. ✅ História pública persistida por match; `story.html?match=...` renderiza o snapshot salvo.
7. ✅ Link social passa por `public-lol-story-page` com Open Graph/Twitter dinâmico e redireciona ao GitHub Pages.
8. ✅ Histórico local de Riot IDs pesquisados.
9. ✅ Comparação com média recente do mesmo modo.
10. ✅ Capítulos variáveis, incluindo capítulo de virada quando há evidência forte.
11. ✅ Impacto 0–100 sensível a modo/função.
12. ✅ Contexto por TOP/JUNGLE/MID/ADC/SUPPORT quando disponível.
13. ✅ Splash art dinâmica e normalização de nomes especiais de campeões.
14. ✅ Itens com nomes e ícones Data Dragon.
15. ✅ Árvores de runas com nomes e ícones Data Dragon.
16. ✅ Feitiços de invocador com nomes e ícones Data Dragon.
17. ✅ Objetivos, torres, roubos, multi-kills e maior sequência entram na história/detalhes.
18. ✅ Homepage cinematográfica com prévia visual antes da busca.
19. ✅ Layout mobile coberto por E2E.
20. ✅ Loading, Riot ID inválido, zero partidas, rate limit e fallback demo tratados.
21. ✅ Perfil padrão de teste: `AlchemyFlames#BR1`.
22. ✅ Browser E2E cobre timeline, Arena, PWA, compartilhamento, histórico, PNG, mobile, recordes, feedback e acessibilidade estrutural.
23. ✅ GitHub Pages automático + smoke pós-deploy.
24. ✅ SEO base + canonical + sitemap + robots + metadata dinâmica por história compartilhada via Edge Function.
25. ✅ PWA instalável com manifest, ícone, service worker e cache local.
26. 🟡 Ads: slot estável, configuração central e consentimento implementados; ativação real depende do `ca-pub`/slot do AdSense.
27. ✅ Privacidade, Termos, Sobre e Contato.
28. ✅ Métricas locais de uso sem envio a terceiros.
29. ✅ Persistência de histórias públicas, timeline cache e histórico local.
30. ✅ Recordes persistentes calculados a partir das histórias publicadas.
31. ✅ Coleção de histórias publicadas nos últimos 30 dias.
32. ✅ Preconnect, cache Data Dragon, lazy-load em ícones e cache de timeline.
33. ✅ Riot API key somente no backend; tabelas sensíveis com RLS e sem acesso direto de anon/authenticated.
34. ✅ Explicação “Por quê?” no impacto.
35. ✅ Resumo da sessão recente.
36. ✅ Web Share, copiar link, PNG social e preview social dinâmico.
37. 🟡 Acessibilidade: skip link, landmarks, status, tab semantics, reduced-motion e CI com axe-core; resultado final depende de manter o workflow verde.
38. ✅ Direção visual cinematográfica preservada; métricas entram apenas quando explicam a história.
39. 🟡 Validação com usuários: infraestrutura de feedback anônimo estruturado está ativa; ainda faltam respostas de usuários reais.
40. ✅ MVP 1.0 tecnicamente concluído; validação real e ativação de monetização seguem como pós-MVP e não bloqueiam o encerramento da implementação pesada.

## Pendências que dependem de terceiros

1. coletar feedback de usuários reais e revisar padrões de resposta;
2. configurar `ca-pub` e slot real quando o AdSense estiver aprovado;
3. opcional: domínio próprio para que links sociais não exibam domínio Supabase no salto de metadata;
4. opcional: substituir janelas estimadas da Arena por rounds oficiais se a Riot passar a expor esse evento.

## Critério de manutenção

Nenhuma feature é considerada estável se Static QA, Browser E2E, Live Update QA, Pages deploy/smoke e Live Riot Data Smoke não estiverem verdes.


## Gate de encerramento

**MVP 1.0 = CONCLUÍDO TECNICAMENTE.**

A partir de 07/10/2026, o repositório entra em validação/manutenção. Não abrir nova frente de features até que feedback real, bug crítico, segurança/compliance ou mudança relevante da Riot justifique o retorno à implementação.
