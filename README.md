# 春日手语园 · A Spring Garden of Signs

> 北京大学爱心社手语分社 · 春日手语文化节 · MMXXVI

一个**手语换装小游戏**：玩家阅读手语动作示意图（不显示文字释义），猜出对应的服装，给主角「手小语」从头到脚搭配一身春装；之后可以在展示墙看到和自己穿一样的同学，在留言区贴一张春日小纸条。

整站是**纯静态前端 + 单文件 Node 服务**，零依赖、零构建步骤、整个项目放进一台 Windows 主机就能给整个校园网用。

🌸 **GitHub**：<https://github.com/WishingCat/Sign-Language-Cultura-Festival>

---

## 玩法

| | |
|---|---|
| **首页** | 起一个昵称、选你的 MBTI（每个维度可选「未知」），系统会按注册顺序分配 `#001`、`#002`…的 UID |
| **试衣间** | 左侧手语卡片三个类别（上衣 / 下装 / 鞋子），点开任一类别，对应的 4 件服装 PNG 会从立绘两侧浮现 |
| **展示墙** | 顶部有你当前造型的大立绘 + 身份卡；下方是同造型同学列表 + 「看看其他人的春装」缩略图墙 |
| **留言区** | 春日便利贴风格的 140 字短留言；可以给别人的留言送 ✿ 一朵花，每人对每条留言只送一次 |

四个 panel 通过顶部调色带 tab 切换（hash 路由 `#/home`、`#/dressing`、`#/wall`、`#/board`）。

---

## 技术栈

- **前端**：原生 HTML + CSS + JS，单文件 IIFE，无框架、无构建
- **后端**：Node 内置模块（`node:http` / `node:fs` / `node:crypto`），不需要 `npm install`
- **存储**：四个 jsonl 文件（`users` / `outfits` / `messages` / `flowers`），文本可读、可备份
- **风格**：Riso-print 春日绘本风 — 霞鹜文楷 + Fraunces 衬线、硬边阴影 + 软地面阴影、纸纤维网点纹理、便利贴
- **MBTI 配色**：NT 🟣 紫 · NF 🟢 绿 · SJ 🔵 蓝 · SP 🟡 黄 · 未知绿

---

## 本地开发

```bash
# 启动 (默认 8080)
node server/server.mjs

# 自定义端口
PORT=8088 node server/server.mjs

# 健康检查
curl http://localhost:8080/api/health
```

需要 **Node 18+**。整库无 `package.json` / 测试 / lint —— 改完直接刷新浏览器或 `node --check` 确认语法。

### 数据相关

```bash
# 清空所有玩家数据（之后启动会自动注入示例种子）
rm -f server/data/*.jsonl

# 强制重新注入示例数据（不删现有）
SEED=force node server/server.mjs
```

启动时如三张表全空，`seedDemoData()` 会自动注入 20 位示例同学（`#001 桃酥` … `#020 蜂蜜`）+ 20 套示例造型 + 16 条春日留言，让展示墙和留言区从一开始就不会显得冷清。真实玩家从 `#021` 开始。

---

## 部署到 PKU 校园网

详细操作（Node 安装 / IPv6 地址查询 / 防火墙 / NSSM 服务化 / 数据备份与导出 / 故障排查表）保存在仓库本地的 `部署方案.md` 中（已 gitignore），不上传到 GitHub。

简版：

1. 把整个项目放到 Windows 一台机器（建议 `D:\sign-festival\`）
2. 装 [Node.js LTS](https://nodejs.org/)
3. 双击 `start-server.bat` 启动服务
4. `ipconfig` 找 `2001:da8:` 开头的 IPv6 地址
5. 管理员 PowerShell 放行 8080 端口：`New-NetFirewallRule -DisplayName "SignFestival 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow`
6. 把 `http://[2001:da8:....]:8080/` 发给同学

---

## API 简表

```
GET  /api/health
POST /api/users/check         { nickname }                       → 检测重名 + 给替代建议
POST /api/users               { uid, nickname, mbti }            → 注册（409 表示重名）
GET  /api/users/me?uid=...                                       → 刷新页面后回填身份
POST /api/outfits             { uid, nickname, t, b, s, mbti }   → 一个 uid 全局只保留最新一身
GET  /api/outfits?t&b&s                                          → 同造型名单
GET  /api/outfits/recent?limit&exclude&excludeUid                → 其他人的造型缩略图列表
GET  /api/messages?limit&since&uid
POST /api/messages            { uid, body }                      → 1–140 字
POST /api/messages/:id/flower { uid }                            → 送花，幂等
```

每 IP 30 POST/分钟限流。

---

## 文件结构

```
.
├─ index.html               入口 + 四个 panel
├─ styles.css               所有样式
├─ game.js                  状态机 + 路由 + UI 接线
├─ start-server.bat         Windows 双击启动
├─ assets/
│  ├─ characters/           86 张换装立绘（{top}{bottom}{shoe}.png）+ start.png
│  ├─ items/                12 张独立服装图（top/bottom/shoe-1..4.png）
│  └─ signs/                手语动作示意卡
└─ server/
   ├─ server.mjs            零依赖 Node 服务
   └─ data/                 jsonl 持久化（gitignored）
```

---

## 致谢

- 项目开发：北京大学爱心社手语分社
- 立绘 / 服装 / 手语示意图：分社志愿者手绘
- 字体：[霞鹜文楷](https://github.com/lxgw/LxgwWenKai) / [Fraunces](https://fraun.ces/)

✿ 春日特辑 · MMXXVI
