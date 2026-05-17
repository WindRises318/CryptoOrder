# API Examples V1

## GET /api/journals
```json
{
  "items": [
    {
      "id": "8a2d357a-5d9c-49da-8e37-3ec7b9668dd0",
      "symbol": "BTCUSDT",
      "side": "long",
      "entryPrice": 62000,
      "exitPrice": 62320,
      "qty": 0.12,
      "fee": 4.32,
      "realizedPnl": 34.08,
      "durationSec": 1880,
      "mae": -40.5,
      "mfe": 88.0,
      "status": "draft",
      "createdAt": "2026-05-17T08:30:00Z",
      "updatedAt": "2026-05-17T08:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "summary": {
    "winRate": 1,
    "netPnl": 34.08,
    "avgPnl": 34.08,
    "maxDrawdown": 0
  }
}
```

## PATCH /api/journals/{id}/note request
```json
{
  "setupTags": ["breakout", "ny-session"],
  "entryReason": "1h breakout + retest",
  "emotion": "calm",
  "executionScore": 4,
  "lessonsLearned": "tp still conservative",
  "planSl": 61920,
  "actualSl": 61980
}
```

## GET /api/reviews/daily
```json
{
  "date": "2026-05-17",
  "totalTrades": 12,
  "winRate": 0.5833,
  "netPnl": 235.4,
  "maxSingleLoss": -85.1,
  "topErrorPattern": "Late chase entries"
}
```
