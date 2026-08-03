# AI 小助手 V1 后端 AC 覆盖映射

本表覆盖 `ACCEPTANCE_CRITERIA.md` 中 AC-000 至 AC-096 的全部后端适用项。UI 专属 AC-090 至 AC-094 不属于后端测试范围。

| AC | 自动化测试证据 | 结果 |
|---|---|---|
| AC-000 | `safety-and-query.test.js`：空、超长、格式无效输入不触发模型或执行器 | 覆盖 |
| AC-001 | `safety-and-query.test.js`：模型候选不能直达设备命令；恶意设备、动作、模式、时间、窗户与替换实体全部被忽略并从原话重提取 | 覆盖 |
| AC-002 | `safety-and-query.test.js`：失败/超时回执禁止成功陈述；无回执聊天和本地知识库不透传多种同义成功模型文本 | 覆盖 |
| AC-003 | `safety-and-query.test.js`：Mock 环境来源传播至回复和结构化来源 | 覆盖 |
| AC-004 | `safety-and-query.test.js`：请求幂等重放与冲突 | 覆盖 |
| AC-005 | `safety-and-query.test.js`：内部异常、凭据、完整敏感对话、电话与住址不进入公开错误或遥测 | 覆盖 |
| AC-006 | `safety-and-query.test.js`：绕过策略/确认的提示不改变链路 | 覆盖 |
| AC-010–AC-013 | `safety-and-query.test.js`、`deepseek-model.test.js`、`dep-003-004-005.test.js`：问候、实质知识、未知主题、急性风险、模型降级；统一免责与医疗强化句（追加关系） | 覆盖 |
| AC-014–AC-019 | `deepseek-model.test.js`、`dep-003-004-005.test.js`：真实模型仅生成 content、不改变业务字段、知识边界、双免责 | 覆盖 |
| AC-020–AC-022 | `safety-and-query.test.js`：环境指标、时间、来源、过期、数值/时间/freshness 无效及字段缺失 | 覆盖 |
| AC-023–AC-026 | `safety-and-query.test.js`：设备查询、歧义、未接入、未知状态 | 覆盖 |
| AC-030–AC-039 | `safety-and-query.test.js`、`dep-003-004-005.test.js`：净化器/油烟机直接执行、智能窗户免确认直接执行并保留校验、noop、拒绝、失败、多设备拆分与查询澄清 | 覆盖 |
| AC-040–AC-047 | `tasks-and-session.test.js`：烹饪摘要、确认、排程、固定模板、依赖和部分成功 | 覆盖 |
| AC-050–AC-057 | `tasks-and-session.test.js`：三模式摘要、确认、Mock/Replay，以及离线/未接入/非法/需确认候选的独立屏蔽证据 | 覆盖 |
| AC-060–AC-067 | `tasks-and-session.test.js`：唯一任务、优化器及逐设备 await 竞态守卫、按保存规格恢复、真实重复停止幂等 | 覆盖 |
| AC-070–AC-077 | `tasks-and-session.test.js`、`dep-003-004-005.test.js`：确认、取消、澄清（选项文本与 continuation 两条链路）、指代、话题切换和历史隔离 | 覆盖 |
| AC-080–AC-085 | `degradation-and-lifecycle.test.js`：各依赖独立降级；依赖恢复后仍复核期限、状态版本和策略；智能窗户免确认不降低能力/状态版本/策略校验 | 覆盖 |
| AC-095 | `dep-003-004-005.test.js`：实时天气/室外数值无可信来源时拒绝，不编造、不把室内快照描述为室外数据 | 覆盖 |
| AC-096 | `dep-003-004-005.test.js`：超过 4000 个 Unicode 字符在语义路由、历史方案检查与模型调用之前返回 `INPUT_TOO_LONG` | 覆盖 |

补充生命周期测试覆盖当天任务到期触发、触发时状态版本复核，以及会话结束后的临时状态清理。

补充测试还覆盖 `deepseek-model.test.js` 的真实模型适配器（DEP-2026-08-03-002）：请求端点、模型、`max_tokens` 限额、15 秒超时、不自动重试，密钥不进入错误与遥测；模型文本无回执时不得携带执行/当前状态事实；`#chat` 与 `#knowledge` 接入真实模型并保留固定模板与 `MODEL_UNAVAILABLE` 降级；模型输出不影响设备、环境、策略与回执链路。对应产品验收为 AC-014 至 AC-019。

`dep-003-004-005.test.js` 覆盖 DEP-2026-08-03-003/004/005 的后端部分：统一免责与医疗强化（AC-010/011/012/019）、E3 实时天气/室外数值拒绝（AC-095）、E4 超长输入先于路由与模型调用返回 `INPUT_TOO_LONG`（AC-096）、智能窗户免确认直接执行并保留能力/状态版本/策略/回执/来源校验（AC-032/033/034/085）、多设备拆分与查询澄清（AC-039）、澄清选项链路（AC-075），以及回执与时间字段完整性。
