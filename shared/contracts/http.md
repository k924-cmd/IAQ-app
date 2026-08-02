# HTTP Transport Contract v1.0.0

本契约只定义本地 V1 联调传输层，不代表生产认证、持久化或公网部署已经完成。

## 基本约束

- 默认监听：`127.0.0.1:8787`，不得默认绑定公网网卡。
- 内容类型：`application/json; charset=utf-8`。
- 请求体上限：64 KiB。
- 服务端请求超时：15 秒。
- V1 不支持 SSE、WebSocket 或流式响应。
- 默认允许来源：`http://localhost:4173`、`http://127.0.0.1:4173`；其他来源返回 403。
- 仅允许 `GET`、`POST`、`OPTIONS`；预检只允许 `Content-Type`。
- 本地开发的 `actorId` 与 `scopeId` 由服务器配置注入；服务器必须忽略浏览器自报身份头。生产身份接入需另立契约。

## GET /v1/health

成功返回 200：

```json
{
  "status": "ok",
  "contractVersion": "1.0.0",
  "mode": "local_mock"
}
```

不得返回环境变量、文件路径、内部堆栈或依赖凭据。

## GET /v1/bootstrap

用于页面首次加载、刷新或重连后获取可信本地 Mock 快照，避免把浏览器旧状态当作后端事实。

成功返回 `BootstrapResponse`：

- `devices`：当前设备注册表快照；
- `environment`：有效环境快照或 `null`；
- `activeTask`：当前 `scheduled`、`running` 或 `paused` 任务，否则为 `null`；
- `mode`：固定为 `local_mock`；
- `observedAt`：服务端生成时间。

所有 Mock 字段必须保留来源标识。

## POST /v1/conversations/messages

- 请求体：`SendMessageRequest`。
- 响应体：`SendMessageResponse`。
- 服务端从本地配置注入可信 `actorId` 和 `scopeId`，再调用 `AssistantService.sendMessage()`。
- UI 确认或澄清按钮应使用请求中的 `continuation`；纯文本确认仍由当前唯一待处理状态解析。

## HTTP 状态映射

| HTTP | 适用情况 |
|---:|---|
| 200 | 请求已被助手链路处理；包括澄清、确认、拒绝、任务冲突、执行失败和依赖降级等结构化结果 |
| 400 | 无法进入助手链路的 JSON、Content-Type、请求体或契约格式错误 |
| 403 | Origin 不在允许列表 |
| 404 | 未定义路由 |
| 405 | 不允许的方法 |
| 409 | `IDEMPOTENCY_CONFLICT` |
| 413 | 请求体超过 64 KiB |
| 415 | Content-Type 不是 JSON |
| 500 | 传输层未处理异常；响应不得泄露内部信息 |
| 503 | HTTP 服务自身不可用 |

只要助手返回了符合 `SendMessageResponse` 的结构化结果，即使其中包含公开错误，HTTP 仍返回 200；前端必须读取 `responseType` 和 `error.code`，不能只依赖 HTTP 状态。

## 本地运行与关闭

- HTTP 适配器必须可通过代码启动和关闭，测试不得占用固定端口。
- 命令行启动可读取非敏感配置：`HOST`、`PORT`、`ALLOWED_ORIGINS`；不得读取或输出任何密钥类变量。
- 进程关闭时停止接受新请求，并等待当前请求完成或达到超时。
