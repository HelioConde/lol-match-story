# Implementation Status — LoL Match Story

Atualizado em 06/10/2026.

Legenda: ✅ concluído · 🟡 parcial · ⏳ pendente

1. ✅ Match-V5 Timeline real via `public-lol-match-story`, com cache privado.
2. ✅ Ponto de virada automático usando eventos + maior swing de ouro.
3. 🟡 Narrativa por modo: Summoner's Rift, Arena e ARAM têm tratamento próprio; ainda cabe refinamento por modos especiais.
4. 🟡 Arena: colocação, augments e dupla suportados; ainda não existe reconstrução round a round.
5. ✅ Card PNG com splash art e formatos 4:5, 9:16 e 1:1.
6. 🟡 Link compartilhável por partida via query string; página estática dedicada por match ainda não existe.
7. ✅ Histórico local de Riot IDs pesquisados.
8. ✅ Comparação com média recente do mesmo modo.
9. ✅ Capítulos variáveis: capítulo extra de ponto de virada aparece quando há evidência forte.
10. ✅ Impacto 0–100 sensível a modo/função.
11. ✅ Contexto por TOP/JUNGLE/MID/ADC/SUPPORT quando disponível.
12. ✅ Splash art dinâmica e normalização de nomes especiais de campeões.
13. ✅ Itens com nomes e ícones Data Dragon.
14. ✅ Árvores de runas com nomes e ícones Data Dragon.
15. ✅ Feitiços de invocador com nomes e ícones Data Dragon.
16. ✅ Objetivos, torres e roubos entram na história/detalhes.
17. ✅ Multi-kills e maior sequência entram na narrativa.
18. ✅ Homepage mostra uma prévia visual antes da busca.
19. ✅ Layout mobile revisado e coberto por teste de overflow.
20. ✅ Loading, Riot ID inválido, zero partidas, rate limit e fallback demo tratados.
21. ✅ Perfil padrão de teste: `AlchemyFlames#BR1`; há smoke test real do backend.
22. 🟡 E2E ampliado para timeline, Arena, PWA, link, histórico, PNG e mobile; manter sempre verde é requisito contínuo.
23. ✅ GitHub Pages automático + smoke test pós-deploy.
24. 🟡 SEO base: canonical, OG/Twitter, sitemap e robots; falta metadata dinâmica por partida pública.
25. ✅ PWA instalável com manifest, ícone e service worker.
26. ✅ Estrutura de anúncios preparada com regras anti-CLS/consentimento; AdSense não está ativado.
27. ✅ Privacidade, Termos, Sobre e Contato.
28. ✅ Métricas locais de uso sem envio a terceiros.
29. 🟡 Persistência: cache de partidas/timeline no backend e histórico local; falta persistência de histórias públicas.
30. ✅ Preconnect, cache de Data Dragon, lazy-load em ícones e cache de timeline.
31. ✅ Riot API key só no backend; timeline restrita a partidas já associadas ao jogador e cache RLS privado.
32. 🟡 Narrativa evita afirmar evento não comprovado; ainda há textos heurísticos quando timeline não está disponível.
33. ✅ Explicação “Por quê?” no impacto.
34. ✅ Resumo da sessão recente.
35. 🟡 Recordes recentes na amostra carregada; recordes históricos permanentes ainda não.
36. ✅ Web Share, copiar link e PNG social.
37. 🟡 Acessibilidade: foco visível, labels principais e reduced-motion; falta auditoria completa WCAG.
38. ✅ Direção visual reforçada para experiência cinematográfica, não dashboard.
39. ⏳ Validação com usuários reais depende de testes externos com usuários.
40. 🟡 MVP 1.0 tecnicamente próximo; faltam principalmente página pública persistida por match, metadata dinâmica e validação real de produto.

## Ordem restante recomendada

1. persistir histórias públicas e criar página dedicada por match;
2. metadata dinâmica/Open Graph por história compartilhada;
3. Arena round-by-round quando a fonte de dados permitir;
4. recordes históricos persistentes;
5. auditoria WCAG;
6. validação com usuários reais;
7. ativação de anúncios somente após consentimento/configuração final.
