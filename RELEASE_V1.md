# LoL Match Story — encerramento técnico 1.0

**Auditoria:** 09/10/2026  
**Estado:** MVP 1.0 desenvolvido e publicado; liberado para **beta controlado**.  
**Atenção:** finalização técnica não é homologação humana, nem aprovação da Riot/AdSense.

## Produto entregue

- [x] Busca de Riot ID e seleção de servidor.
- [x] Narrativas pós-partida de Summoner's Rift, ARAM e Arena.
- [x] Timeline real da Riot, pontos de virada e eventos contextualizados.
- [x] Comparação de impacto por modo, resumo de sessão, destaques e recordes.
- [x] História pública persistente, link social com metadados dinâmicos e PNG compartilhável.
- [x] PT-BR principal com inglês como segundo idioma.
- [x] Layout desktop/tablet/mobile, PWA e fallback demonstrativo identificado.
- [x] Consentimento preparado para anúncios, **sem ativar IDs fictícios**.
- [x] Chave da Riot confinada a Edge Functions no Supabase gamer.

## Validações e correções de encerramento — 09/10/2026

- [x] Supabase gamer `bieihhaobdztjyoweewa` verificado `ACTIVE_HEALTHY`.
- [x] Cinco funções verificadas `ACTIVE`: `public-lol-profile`, `public-lol-match-story`, `public-lol-story`, `public-lol-story-page` e `public-lol-feedback`.
- [x] RLS habilitado em `lol_timeline_cache`, `lol_public_stories` e `lol_story_feedback`, sem `SELECT` direto para `anon` ou `authenticated`.
- [x] Smoke real de `AlchemyFlames#BR1`: 5 partidas, primeiro match `BR1_3288690697` em Arena, **31 eventos** e **14 janelas de combate estimadas** na timeline.
- [x] Publicação/consulta da história, recordes, HTML de compartilhamento com Open Graph e endpoint de feedback confirmados no backend real.
- [x] Corrigido o service worker: somente cache da própria aplicação; não armazena URLs com Riot ID/query e não apaga caches de outros projetos na mesma origem.
- [x] Corrigido o atualizador da página: atualiza somente o próprio service worker e limpa somente caches identificados pelo prefixo `lol-match-story-`.
- [x] Adicionados testes Playwright de isolamento de cache, regressão de versões e navegação offline.
- [x] Ajustado o workflow de capturas para garantir a instalação da revisão do Chromium exigida pelo Playwright.
- [x] Alinhado o pacote para versão `1.0.0`, com dependências de QA fixadas.
- [x] Deploy de código atualizado para GitHub Pages e smoke HTTP do site aprovados.
- [x] Static QA e Live Update QA aprovados no novo código.
- [x] Browser E2E completo aprovado: **102/102 testes passaram** após a correção da simulação de atualização do PWA.
- [x] Capturas full-page desktop/tablet/mobile aprovadas; revisão do Chromium instalada corretamente pelo CI.

### Evidências

- [Smoke real da Riot — perfil, timeline, publicação e social](https://github.com/HelioConde/lol-match-story/actions/runs/37924174395)
- [GitHub Pages — deploy aprovado](https://github.com/HelioConde/lol-match-story/actions/runs/37924241994)
- [Site em produção — smoke aprovado](https://github.com/HelioConde/lol-match-story/actions/runs/37924292429)
- [Static QA](https://github.com/HelioConde/lol-match-story/actions/runs/37924242028)
- [Live Update QA](https://github.com/HelioConde/lol-match-story/actions/runs/37924241981)
- [Browser E2E — 102 testes aprovados](https://github.com/HelioConde/lol-match-story/actions/runs/37924528423)
- [Capturas visuais — workflow aprovado](https://github.com/HelioConde/lol-match-story/actions/runs/37924236851)

## Critérios pendentes de validação humana/terceiros

- [ ] Validar `AlchemyFlames#BR1` diretamente na interface publicada num dispositivo real.
- [ ] Validar 2–3 Riot IDs reais adicionais em regiões e filas diferentes.
- [ ] Confirmar compartilhamento do card e abertura do link social em apps reais.
- [ ] Coletar feedback de usuários sobre clareza e precisão da narrativa.
- [ ] Ativar Google AdSense somente depois da aprovação, do Publisher ID e dos slots reais.
- [ ] Reavaliar o contrato da API se a Riot alterar Match-V5/Timeline.

## Regra de manutenção

O desenvolvimento de funcionalidades novas fica **congelado** até haver bug crítico, risco de segurança/compliance, mudança da Riot ou feedback concreto. O produto é uma **história de partida**, não um tracker genérico.

A issue de validação humana permanece aberta: [#1 — Pós-MVP 1.0](https://github.com/HelioConde/lol-match-story/issues/1).
