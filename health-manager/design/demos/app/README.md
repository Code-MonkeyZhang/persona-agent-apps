# Health Manager · 设计 Demo

App 设计的原样副本，一个 demo 内切换两种展示形态：手机外框与 Nova 桌面壳。顶部悬浮胶囊按钮切换，选择记住在 localStorage。

- `src/app/` 是 `web/src/` 的拷贝，两处改动：`useHealthData.ts` 的 WebSocket 数据源换成静态快照，写入类 action 变为空操作；`MobileApp.tsx` 用 MemoryRouter 替代 BrowserRouter 并从疾病路由起步，不污染 demo 页地址。疾病页结构与 `web/src` 保持一致，改动先在 demo 里评审，定稿后同步回正式工程
- `src/mock/snapshot.ts` 由 `data/health.mock.db` 经 `HealthDB.get_snapshot()` 导出，另合并 mock 病历目录，demo 展示的就是演示模式的数据
- `src/PhoneDemo.tsx` 与 `src/demo.css` 是手机外框和缩放容器，`src/shell/` 是 Nova 壳复刻，结构对照 `ui-design/ui-demos/desktop-demo-nova`：标题栏、会话侧栏、对话区、手机屏面板。这些是展示家具，不属于 App 设计
- `src/DemoStage.tsx` 是形态切换器，两种形态渲染同一份 `src/app` 副本

运行：

```bash
cd Design/demos/app
npm install
npm run dev
```

上游改版后同步：重新拷贝 `web/src/` 覆盖 `src/app/`，再重放 `useHealthData.ts` 与 `MobileApp.tsx` 两处差异。
