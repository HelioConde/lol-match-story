# Contrato de dados — LoL Match Story

## Entrada
`POST /public-lol-profile`

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

## Campos mínimos esperados por partida
- id/matchId;
- championName/championId;
- win;
- kills/deaths/assists;
- gameDuration/duration;
- CS;
- visionScore;
- goldEarned.

O adaptador aceita provisoriamente `matches`, `recentMatches` ou `data.matches`.

## Próxima evolução
Adicionar eventos derivados da timeline para construir capítulos com fatos reais, sem enviar payload bruto desnecessário ao navegador.
