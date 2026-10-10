# FYX · 个人游戏主页

集 **个人主页 / 博客 / 论坛 / 朋友圈 / 即时聊天 / 成绩墙 / 开源项目 / 网站推荐 / AI 助手** 于一体的小站，附带全站后台。

- **端口**：`9527`（非常用端口）
- **技术栈**：Vite + React 19 + TypeScript + Tailwind CSS v4 + **shadcn/ui**（radix-nova）+ Framer Motion + Express 5
- **视觉**：极简暗黑 + 单色高亮（高亮色可在后台修改）
- **开屏动画**：FYX 逐字揭示 + 进度线 + 状态文案（后台可关/可调）
- **BGM**：《Desultory Signals》— technoplanet（Phigros Chapter IX），右下角常驻播放器
- **Markdown**：博客正文、公告、简介、动态、回复、评论等所有内容文字全站统一渲染 Markdown
- **AI 助手**：右下角浮窗；用户可填自己的 API，管理员可配全局 API（OpenAI 兼容，地址以 `/v1` 结尾），支持模型 / 温度 / top_p / max_tokens / 系统提示词多参数

## 启动与更新

```bash
npm install --registry=https://registry.npmmirror.com        # 安装依赖（推荐 npmmirror 国内源加速）
npm run build      # 构建前端 → dist/
npm start          # 启动服务（0.0.0.0:9527）
```

### 一键拉取更新 (update.sh)

`update.sh` 脚本默认已配置使用 `https://registry.npmmirror.com` 镜像源执行 `npm install`。

```bash
./update.sh                                # 默认从当前对话分支 (arena/8cd56a9a-fyx-homepage) 拉取更新、使用 npmmirror 源安装依赖并构建
./update.sh main                           # 指定从 main 或其他分支更新
```

开发模式（可选）：`npm run dev`（Vite 于 5199，API 代理到 9527）。

## 后台

访问 `/admin`，默认账号：

- 用户名 `fyx`
- 密码 `fyx2026`（**登录后请在「安全」里立即修改**）

后台模块：概览 · 站点设置（Hero/开屏/BGM/高亮色/公告/关于/图标与配图）· **文案库（全站每个可见文字逐条编辑）** ·
游戏管理（含角色卡、图库）· **开源项目（图片卡→跳转仓库）· 网站推荐（图片卡→跳转站点）** · 成绩墙（上传成绩图/视频）·
博客 · 论坛 · 朋友圈 · **AI 设置（全局 API/模型/多参数/测试连接）** · 用户 · 安全。

### AI 助手配置

- **管理员**：后台「AI 设置」填全局地址（`https://…/v1`）、Key、默认模型与参数；「测试连接」验证可用性。
- **用户**：右下角 AI 浮窗 → 设置 →「我的配置」填个人 API，**逐字段覆盖**管理员配置（谁的 Key 谁付费）。
- 协议为 OpenAI 兼容（`POST {baseUrl}/chat/completions`，流式输出）；Key 只存服务端 `server/data/db.json`，公开配置接口已脱敏。

## 结构

```
server/           Express 5 API + JSON 存储（server/data/db.json）
  index.js        全部接口（鉴权/内容/上传/社区）
  default-config.js  默认站点配置与种子内容
src/
  components/     Splash 开屏、MusicPlayer、Nav、GamesSection、AchievementWall、Lightbox…
  pages/          Home / Blog / Forum / Moments / Chat / Auth
  pages/admin/    后台九大模块
public/
  images/         游戏与角色图片（来自公开网络，个人使用）
  audio/          Desultory Signals.m4a
research/notes.md 资料搜集笔记（调研来源与整理）
```

## 说明

- **每个字**：首页、博客、论坛、朋友圈、聊天、登录页等所有可见文案，均在后台「文案库」逐条修改（支持搜索、单项恢复默认、一键全部恢复）。
- **每张图**：游戏/角色封面与图库、音乐封面、博客封面、成绩墙资源在各自模块管理；Hero 背景图、关于配图、网站图标 FAVICON 在「站点设置」上传替换。
- 所有图片、音频均来自公开网络资源，仅个人非商业使用；版权归原作者所有。
- 注册开放可在后台关闭；论坛/朋友圈/聊天均需登录。
