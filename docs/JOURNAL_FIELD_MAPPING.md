# Journal Field Mapping (UI ↔ API ↔ DB)

| UI 字段 | API 字段 | DB 字段 |
|---|---|---|
| 标的 | symbol | journals.symbol |
| 方向 | side | journals.side |
| 开仓价 | entryPrice | journals.entry_price |
| 平仓价 | exitPrice | journals.exit_price |
| 数量 | qty | journals.qty |
| 手续费 | fee | journals.fee |
| 已实现盈亏 | realizedPnl | journals.realized_pnl |
| 持仓时长 | durationSec | journals.duration_sec |
| MAE | mae | journals.mae |
| MFE | mfe | journals.mfe |
| 状态 | status | journals.status |
| 策略标签 | setupTags[] | journal_tag_rel + journal_tags |
| 入场理由 | entryReason | journal_notes.entry_reason |
| 情绪 | emotion | journal_notes.emotion |
| 执行评分 | executionScore | journal_notes.execution_score |
| 复盘结论 | lessonsLearned | journal_notes.lessons_learned |
| 计划止损 | planSl | journal_notes.plan_sl |
| 实际止损 | actualSl | journal_notes.actual_sl |
