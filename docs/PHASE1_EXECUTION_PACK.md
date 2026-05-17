# Phase 1 执行包（可直接开工）

> 目标：把“交易”与“交易笔记”真正融合，完成第一个可上线闭环。

## A. Phase 1 范围（4 周）

### A1. 交付目标
1. 完成交易后自动生成 Journal 草稿。
2. 用户可在 60 秒内完成“补充笔记并保存”。
3. 可按标签、方向、盈亏筛选日志。
4. 日复盘卡片可展示当日核心指标。

### A2. Out of Scope
- 实盘交易所 API 对接（先模拟盘）。
- AI 周报自动生成（后续 Phase 2）。
- 团队协作权限（Team 版后置）。

---

## B. 详细用户流程（含边界）

### B1. 主流程：交易后补记笔记
1. 用户开仓。
2. 用户平仓。
3. 系统收到 `trade_closed` 事件并创建 `journal_draft`。
4. Journal 列表出现“待补充”状态。
5. 用户点击详情抽屉，填写策略标签、入场理由、情绪、执行评分。
6. 用户保存后状态变更为“已完成”。

### B2. 异常流程
- 若事件重复投递：按 `trade_id` 幂等写入，不产生重复日志。
- 若保存失败：保留草稿缓存并提示重试。
- 若字段缺失：提示必填项（标签、执行评分）。

---

## C. 页面与组件清单（给设计与前端）

### C1. Journal 列表页
- FilterBar：时间范围、方向、多标签、盈亏。
- JournalTable：交易基础字段 + 笔记完成度。
- QuickStats：胜率、净收益、平均盈亏、最大回撤。

### C2. Journal 详情抽屉
- 自动字段区（只读）：symbol/entry/exit/qty/fee/duration/mae/mfe。
- 主观字段区（可编辑）：
  - `setup_tag[]`
  - `entry_reason`
  - `emotion`（calm/fomo/revenge）
  - `execution_score`（1-5）
  - `lessons_learned`
- CTA：保存、保存并下一条。

### C3. 日复盘卡片
- 当日交易次数
- 当日胜率
- 净收益
- 最大单笔亏损
- Top 1 错误模式

---

## D. 数据库草案（Phase 1 最小）

```sql
-- journals
id uuid pk
user_id uuid not null
trade_id uuid not null unique
symbol varchar(20) not null
side varchar(10) not null
entry_price numeric(20,8) not null
exit_price numeric(20,8) not null
qty numeric(20,8) not null
fee numeric(20,8) not null default 0
realized_pnl numeric(20,8) not null
duration_sec int not null
mae numeric(20,8)
mfe numeric(20,8)
status varchar(20) not null default 'draft' -- draft/completed
created_at timestamptz not null
updated_at timestamptz not null

-- journal_notes
journal_id uuid pk references journals(id)
entry_reason text
emotion varchar(20)
execution_score int check (execution_score between 1 and 5)
lessons_learned text
plan_sl numeric(20,8)
actual_sl numeric(20,8)
updated_at timestamptz not null

-- journal_tags
id uuid pk
name varchar(40) unique not null

-- journal_tag_rel
journal_id uuid references journals(id)
tag_id uuid references journal_tags(id)
primary key (journal_id, tag_id)
```

---

## E. API 合同（Phase 1）

### E1. 查询日志列表
`GET /api/journals?from=&to=&side=&tag=&pnl=`

返回：分页 + 汇总统计。

### E2. 查询日志详情
`GET /api/journals/{id}`

### E3. 更新日志笔记
`PATCH /api/journals/{id}/note`

请求体：
```json
{
  "setupTags": ["breakout", "ny-session"],
  "entryReason": "1h structure breakout + retest",
  "emotion": "calm",
  "executionScore": 4,
  "lessonsLearned": "tp too conservative",
  "planSl": 62000.0,
  "actualSl": 62120.0
}
```

### E4. 当日复盘摘要
`GET /api/reviews/daily?date=YYYY-MM-DD`

---

## F. 验收标准（Gherkin）

1. **自动草稿生成**
- Given 用户完成一笔平仓
- When 系统接收到 `trade_closed`
- Then 3 秒内在 Journal 列表可看到 draft 记录

2. **笔记完成**
- Given 用户打开 draft 记录
- When 填写必填字段并保存
- Then 状态变更为 completed 且更新时间刷新

3. **筛选准确**
- Given 用户选择标签与方向过滤
- When 执行查询
- Then 结果只包含符合条件的记录

---

## G. 研发任务拆分（Jira/Epic）

### Epic 1: Event → Journal
- BE-1: 定义 `trade_closed` 事件 schema
- BE-2: 幂等写入 journal draft
- BE-3: 失败重试与告警

### Epic 2: Journal CRUD
- BE-4: Journal 列表与详情 API
- BE-5: Note 更新 API + 参数校验
- FE-1: Journal 列表页
- FE-2: Journal 详情抽屉

### Epic 3: Review Summary
- BE-6: 每日统计聚合任务
- FE-3: 日复盘卡片

---

## H. 埋点方案（最小可用）

- `journal_draft_created`
- `journal_opened`
- `journal_saved`
- `journal_completed`
- `journal_filter_applied`

关键漏斗：
`trade_closed → journal_opened → journal_completed`

---

## I. 上线与回滚

### I1. 灰度
- 10% 用户开启 Journal 新版。
- 观察 48 小时：错误率、保存成功率、完成率。

### I2. 回滚
- 前端：Feature Flag 关闭 Journal 新入口。
- 后端：保留写入，关闭读取新字段；数据不回滚，仅降级展示。

