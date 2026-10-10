# FYX 个人主页 · 资料搜集笔记

> 说明：围绕三款游戏与指定角色做了系统性检索（游戏档案、角色档案、版本动态、曲目档案、图片素材等，
> 覆盖官网/维基/百科/媒体/社区多类来源，关键信息交叉核对）。以下为整理后的有效资料摘要与来源。

## 1. UI / 技术选型（应「务必搜索最丝滑现代 UI 库」要求）

- **shadcn/ui**：2026 年主流选择，Tailwind + Radix 基座、组件代码归自己所有、默认观感精致。
  来源：5 Best React UI Libraries 2026、React Component Libraries in 2026 等多篇综述一致推荐。
- **HeroUI（原 NextUI）**：开箱即美的代表，内置流畅动画。
- **Aceternity / Magic UI**：动效类组件库，适合 Hero 与展示型页面。
- **结论**：本站采用 **Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui（radix-nova 预设）+ Framer Motion**，
  视觉走用户选定的「极简暗黑 + 单色高亮」路线。

## 2. 音乐《Desultory Signals》

- 曲目真实存在：**Phigros 主线最终章 第9章「穹窿的孤舟」(Chapter IX · Solivault)** 收录曲。
- 作曲：**technoplanet**；难度 EZ10 / HD14 / IN17 / **AT18**（Phigros 首个 18 级）；插画：月光大刺剑。
- 章节于 2026-09-25 上线；来源：Phigros 官方 X(@Phigros_PGS_JP)、namu.wiki、YouTube（Phigros BGM 高音质视频）。
- 音频已从公开视频源下载并转封装为标准 M4A，存于 `public/audio/desultory-signals.m4a`。

## 3. Phigros

- 开发商：Pigeon Games 鸽游（厦门/南京鸽游网络），非商业、无内购的节奏游戏。
- 玩法：四类音符 + 无固定轨道 + 持续移动变换的判定线；200+ 首电音、数十位画师插画。
- **重点角色：鸠** —— Pigeon Games 一周年发布的概念角色，游戏封面看板娘（TapTap 测评等资料）。
- 其他：剧情角色 Gino；主线 1–8 章 + EX + Side Story + 最终章 第九章（ARG 解谜）。
- 版本：v3.20.0（2026-09）。

## 4. 绝区零（重点：叶瞬光、蕾米埃尔）

- miHoYo 开发，2024-07-04 公测；舞台「新艾利都」，玩家为绳匠「法厄同」（哲/铃兄妹）。
- **叶瞬光**：云岿山阵营，凛刃（变种物理）· 强攻，**第二位虚狩**；叶释渊师妹；
  关键武器「青溟剑」会吞噬记忆与五感；双形态（常态 / 白发红瞳「明心境」）；
  2.5 版本「微光引灯时」（2025-12-30）上线；动画短片《若能化作光芒》。
  来源：游民星空角色档案、中关村在线、ZOL 等。
- **蕾米埃尔·丹（Remielle Dan）**：**初代虚狩**之一，前节杖军中校，秘密组织「达识结社」成员，
  羽希人；因「静默之日」沉睡百年；**3.1 版本「漫长的告别」**（2026-07）上线，
  流明属性；官方立绘含「唯有越过知识的边界，才能触碰真实的虚像」。
  来源：网易云游戏 3.1 解析、新浪新闻、Bilibili 绝区零 Wiki 官方立绘。
- 版本动态：3.0 登陆 Steam；3.2 第二阶段「Their Secret Histories」（2026-09-30）；3.3 定档 2026-10-21。

## 5. 异环（Neverness to Everness）

- 完美世界旗下 **Hotta Studio（幻塔工作室）** 自研，超自然都市开放世界 RPG。
- 舞台：沿海大都市**海特洛市**；异象 / 异能者 / 管理局设定；古董店「伊波恩」。
- 主角：**零**（零号异象，首位无证上岗的异象猎人，失忆、能力不可测）。
- 角色：娜娜莉（S·灵）、早雾（S·咒）、法帝娅（S·魂）、安魂曲（S·暗，「只想早点下班」）、
  薄荷（A）、哈索尔、白藏、浔、阿德勒、翳、小吱、残虹等。
- 国服 2026-04-23 公测，国际服 2026-04-29；TapTap / App Store / 游侠网角色图鉴。

## 6. 图片素材（全部来自公开网络，个人使用）

| 文件 | 内容 | 来源类型 |
| --- | --- | --- |
| zzz-yeshunguang.jpg | 叶瞬光·明心境（白发红瞳） | 攻略站官方图 |
| zzz-yeshunguang-2.jpg | 叶瞬光 常态 | 逸趣事件图 |
| zzz-yeshunguang-battle.jpg | 叶瞬光 战斗 | 媒体前瞻 |
| zzz-remeielle.png | 蕾米埃尔·丹 官方立绘 | Bilibili 绝区零 Wiki |
| zzz-remeielle-2.png | 蕾米埃尔 泳装 | 米游社官方发文 |
| phigros-cover.jpg / phigros-jiu.png / phigros-jiu-2.jpg | 鸠 & Phigros 官方横幅 | 官方宣传图 |
| phigros-chart.jpg | Phigros 谱面实机 | 实机截图 |
| yihuan-cover.jpg 等 | 异环主视觉 / 群像 / 街景 | TapTap 官方截图、海报 |

## 7. 功能范围

个人主页 + 博客 + 论坛 + 朋友圈 + 即时聊天 + 成绩墙（后台上传图片/视频）+ 开屏动画 +
BGM 播放器 + 全站后台（/admin：站点/游戏/成绩墙/博客/论坛/朋友圈/用户/安全）。
