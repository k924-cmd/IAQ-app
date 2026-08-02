# Frontend

静态 PWA UI 基线。页面通过 `src/services/` 访问数据，当前服务全部连接 `src/mocks/`，不依赖 `backend/` 内部实现。

```powershell
cd frontend
python -m http.server 4173
```

前后端接入时只替换服务适配器，并保持 `shared/contracts/` 兼容。
