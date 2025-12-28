为 IoT Platform 生成前端：Vue3 + Vite + JavaScript + Pinia + Vue Router + Element Plus + Axios + ECharts。
仅使用 REST API（前缀 /api/v1），根据我提供的 docs/api-docs.json(swagger-OpenAPI 3.0) 自动生成/实现 API Client 与类型。
要求：
1) 统一响应结构{code,message,data}；
2) JWT Bearer 登录：保存 access_token/refresh_token，axios 自动加 Authorization；401 自动尝试 refresh，失败跳转登录；
3) RBAC：staff 只读，admin 可做新增/编辑/删除/下发命令；
4) 页面：登录、仪表盘、洁净室、网关、设备、命令历史、用户管理(admin)。
5) Telemetry：设备/洁净室最新值与历史曲线（ECharts），支持时间范围、聚合(agg/interval/limit)。
6) Element Plus 布局：左侧菜单+顶部栏+主内容，移动端自适应。
7) 目录规范：src/{api,stores,router,views,components,layouts,utils,styles}; 组件可复用；
8) 错误处理：全局消息提示、loading、空状态；
9) .env 配置 VITE_API_BASE=http://localhost:3000。
10) 界面语言始终为中文。
