# Journal UI Wireframes（结构稿）

## 1) Journal 列表页

```
+--------------------------------------------------------------------------------+
| Header: Journal                     [DateRange] [Side] [Tags] [PnL] [Search]  |
+--------------------------------------------------------------------------------+
| QuickStats: Trades | WinRate | NetPnL | AvgPnL | MaxDrawdown                  |
+--------------------------------------------------------------------------------+
| Table                                                                         |
| Time     Symbol  Side  Entry  Exit   Qty   PnL     Status     Tags   Action   |
| ...                                                                          ...|
| [Pagination]                                                                  |
+--------------------------------------------------------------------------------+
```

交互说明：
- 点击行 -> 右侧 Drawer 打开详情。
- `Status=draft` 高亮黄色，鼓励补记。
- 筛选变化后保留 URL query，支持分享与刷新恢复。

## 2) Journal 详情 Drawer

```
+------------------------------- Drawer ----------------------------------------+
| [Auto Fields]                                                                |
| Symbol Side Entry Exit Qty Fee Duration MAE MFE                              |
|------------------------------------------------------------------------------|
| [Editable Note]                                                              |
| Setup Tags* [multi-select chips]                                             |
| Entry Reason [textarea]                                                      |
| Emotion [calm/fomo/revenge/fear/greed]                                       |
| Execution Score* [1..5]                                                      |
| Lessons Learned [textarea]                                                   |
| Plan SL / Actual SL                                                          |
|------------------------------------------------------------------------------|
| [Save] [Save & Next]                                                         |
+------------------------------------------------------------------------------+
```

校验规则：
- 必填：`setup tags >= 1`、`execution score`。
- 保存成功后 toast + 列表状态切换 completed。

## 3) Daily Review 卡片

```
+---------------- Daily Review (YYYY-MM-DD) ----------------+
| Trades: 12    WinRate: 58.3%    NetPnL: +235.40          |
| Max Single Loss: -85.10                                 |
| Top Error Pattern: Late chase entries                    |
| [View all journals for this day]                         |
+-----------------------------------------------------------+
```

状态：
- 无数据：展示 empty state + 引导去 Trade。
- 加载中：骨架屏。
- 错误：可重试。
