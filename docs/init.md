请基于我提供的 /docs/swagger.json 生成一个可运行的 Vue3+Vite+TS 管理台前端（Element Plus 风格），仅 REST（/api/v1）。严格按以下要求实现：

A. 全局与工程
1) 使用 npm 作为包管理器。
2) src 结构：
- api/: axios 实例、拦截器、模块化 API（auth/users/cleanrooms/gateways/devices/commands/telemetry）
- stores/: authStore、appStore(主题/折叠菜单)、dictStore(枚举映射)
- router/: 路由、守卫(登录/角色)
- layouts/: AdminLayout（侧边栏+顶部栏+面包屑+内容区）
- views/: Login, Dashboard, Cleanrooms, Gateways, Devices, Commands, Users
- components/: 通用表格/筛选栏/PageHeader/JsonViewer/ConfirmDialog/TelemetryChart
3) UI：Element Plus + @element-plus/icons-vue；统一浅色主题；页面内使用 Card + Table + Form + Drawer/Dialog。
4) Axios：baseURL=VITE_API_BASE + '/api/v1'；超时10s；request 附带 Authorization；response 若 code!=0 统一 ElMessage.error；401 走 refresh(/auth/refresh)；刷新成功重放请求；失败清空 token 并跳登录。
5) Auth：登录(/auth/login)拿到 access_token/refresh_token/expires_in/user；store+localStorage 持久化；/auth/me 用于启动时恢复登录态。
6) RBAC：路由 meta.roles；admin 才显示“新增/编辑/删除/下发命令/用户管理”按钮；staff 仅查询与查看图表。

B. 路由与菜单（/）
- /login
- / (AdminLayout)
  - /dashboard（仪表盘）
  - /cleanrooms（洁净室管理）
  - /gateways（网关管理）
  - /devices（设备管理）
  - /commands（命令历史）
  - /users（用户管理，仅admin）
顶部栏：当前用户(username/role)、退出登录、（可选）刷新按钮。
侧边栏：按角色动态渲染。

C. 各页面功能细化（必须按 swagger 接口实现）
1) Dashboard：
- 展示系统健康 /health（mysql/influxdb/rabbitmq/service 状态）。
- 关键 KPI：洁净室数量、设备数量、网关数量（分别调用 list 接口取 total）。
- “最新遥测概览”：选择洁净室 -> 调 /cleanrooms/{id}/telemetry/latest，表格显示 device name/type/value/unit/ts，可按 type 筛选。
2) Cleanrooms：
- 列表：GET /cleanrooms?page&page_size&keyword；表格字段：id,name,is_active,created_at；支持关键字搜索、分页。
- 详情抽屉：显示 meta(JSON Viewer)。
- admin：新增 POST /cleanrooms；编辑 PATCH /cleanrooms/{id}；删除 DELETE /cleanrooms/{id}（删除前二次确认）。
- 查看该洁净室可用网关：GET /cleanrooms/{id}/gateways（展示列表即可）。
- 最新遥测：入口按钮跳转到“洁净室遥测面板”（可复用同页 Drawer）调用 /cleanrooms/{id}/telemetry/latest。
3) Gateways：
- 列表/新增/编辑/删除：/gateways + /gateways/{id}
- 关联洁净室：在网关详情页提供“绑定洁净室”对话框：
  - GET /gateways/{id}/cleanrooms 列已绑定
  - POST /gateways/{id}/cleanrooms 绑定（body: cleanroom_id, meta）
  - DELETE /gateways/{id}/cleanrooms/{cleanroom_id} 解绑
4) Devices：
- 列表：GET /devices（支持 type/gateway_id/cleanroom_id/keyword/page）
- 详情：GET /devices/{id}，显示 meta(JSON)
- admin：新增/编辑/删除（/devices, /devices/{id}）
- 遥测：
  - 最新：GET /devices/{id}/telemetry/latest（展示值与 ts）
  - 历史：GET /devices/{id}/telemetry?from&to&agg&interval&limit
  - UI：时间范围选择器(from/to)、agg 下拉(raw/mean/min/max/last)、interval 输入(如 1m/5m/1h)、limit 输入；用 ECharts 折线图渲染 points(ts,value)
- 下发命令（admin）：
  - POST /devices/{id}/commands（body: command_name, payload）
  - UI：Dialog 表单：command_name(必填) + payload(JSON编辑器/textarea)；成功后跳转命令详情或在页面提示 command_id。
5) Commands：
- 列表：GET /commands?page&page_size&device_id&issued_by&from&to
- 详情：GET /commands/{id}
- 展示字段：id,device_id,issued_by,command_name,payload,created_at；payload 使用 JSON Viewer。
6) Users（admin only）：
- 列表：GET /users?page&page_size&role&keyword
- 新增：POST /users（username,password,role,email）
- 更新：PATCH /users/{id}（role,email,is_active）
- 重置密码：POST /users/{id}/reset-password（new_password）

D. 交互与体验要求
1) 所有列表页：顶部 FilterBar（keyword/筛选项/查询/重置）；表格分页；空态；加载状态。
2) 所有写操作：Form 校验；提交 loading；成功 ElMessage.success 并刷新列表。
3) meta/payload：提供一个通用 JsonViewer 组件（折叠、复制）。
4) 国际化不做；时间统一显示本地格式（dayjs）。
5) 最终输出：完整代码 + 运行方式 + 默认页面说明。

现在开始生成项目代码（不要伪代码），从项目初始化、依赖、目录、到每个核心文件逐步给出。
