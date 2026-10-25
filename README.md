<div align="center">
  <h1>📖 LoL Match Story</h1>
  <p><strong>Transforme partidas recentes de League of Legends em histórias visuais com contexto, momentos decisivos e desfecho.</strong></p>
  <p><img alt="Status" src="https://img.shields.io/badge/status-beta%20controlado-64748b"> <img alt="Dados" src="https://img.shields.io/badge/Riot%20API-backend-334155"></p>
  <p><a href="RELEASE_V1.md"><strong>Relatório técnico</strong></a> · <a href="IMPLEMENTATION_STATUS.md"><strong>Implementação</strong></a> · <a href="#executar-localmente"><strong>Executar</strong></a></p>
</div>

## O que o projeto faz

**LoL Match Story** apresenta uma partida como uma pequena narrativa, com começo, capítulos, eventos e resultado. Em vez de criar outro tracker de tabelas, o usuário consulta seu **Riot ID**, escolhe uma partida e explora os acontecimentos disponíveis.

**Estado:** MVP técnico publicado e documentado como **beta controlado**. O lançamento amplo ainda depende de validação humana, requisitos de uso da Riot e acompanhamento da integração em produção.

## Como funciona

```text
Riot ID + região
      ↓
Histórico recente disponível
      ↓
Seleção de uma partida
      ↓
Resumo e timeline quando disponíveis
      ↓
4 capítulos + destaques + compartilhamento
```

| Parte | Descrição |
| --- | --- |
| **Resumo** | Resultado, contexto e estatísticas relevantes |
| **Capítulos** | Quatro partes organizando a partida |
| **Momentos-chave** | Eventos obtidos ou derivados da timeline disponível |
| **Impacto** | Indicador heurístico de 0 a 100, baseado em sinais observáveis |
| **Compartilhamento** | Card/visão pública conforme opções da interface |
| **Idiomas** | Português e inglês |
| **Indisponibilidade** | Estados de erro e fallback demonstrativo identificado |

**Não há geração livre de fatos:** a narrativa é limitada aos dados de Match-V5, timeline e histórico retornados pela integração. Um valor de impacto não é uma medição universal da contribuição de um jogador nem explica sozinho a vitória.

## Fontes e privacidade

O frontend usa o backend gamer por funções como `public-lol-profile` e `public-lol-match-story`. Os dados reais podem estar indisponíveis por rate limit, ausência de timeline ou falha da rede.

**A Riot API key não deve ser incluída no frontend.** Dados de demonstração precisam permanecer identificados. Regras de privacidade e publicação de páginas compartilháveis exigem atenção antes de abrir o produto ao público amplo.

## Executar localmente

Requer Node.js e npm:

```bash
git clone https://github.com/HelioConde/lol-match-story.git
cd lol-match-story
npm install
npm run dev
```

Abra `http://localhost:4173` (porta definida no script). Para QA:

```bash
npm run check
npm run test:e2e
npm run check:visual
```

Os comandos dependem dos ambientes necessários, incluindo Playwright para testes de navegador. **Esta revisão do README não executou o build nem os testes.**

## Documentação

[Relatório de versão](RELEASE_V1.md) · [Estado de implementação](IMPLEMENTATION_STATUS.md) · [Contrato de perfil](PROFILE_CONTRACT.md) · [Política de API](RIOT_API.md) · [Histórico completo do README](docs/README_HISTORY_2026-10-25.md)

Projeto independente, não oficial, sem afiliação à Riot Games. Desenvolvido por [Hélio Conde](https://github.com/HelioConde).
