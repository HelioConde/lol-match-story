# Riot API — LoL Match Story

O projeto reutiliza a infraestrutura gamer do ZeroTwo.gg.

- Supabase: `bieihhaobdztjyoweewa`
- Edge Function inicial: `public-lol-profile`
- chave Riot: somente server-side
- entrada: Riot ID + plataforma
- saída: resumo derivado e partidas recentes

## Requisição do frontend

```json
{
  "gameName": "HelioConde",
  "tagLine": "BR1",
  "platform": "br1",
  "region": "americas",
  "limit": 12,
  "matchLimit": 12
}
```

## Princípios

- preferir PUUID internamente;
- não devolver a Riot API key;
- cachear chamadas;
- não criar MMR/ELO alternativo;
- foco exclusivamente pós-partida;
- fallback demo deve ser visualmente identificado.

O adaptador do frontend atualmente aceita `matches`, `recentMatches` ou `data.matches` enquanto o contrato final é validado.
