# Orbit：首次上线准备清单

演示站继续保留：[Orbit Demo](https://starry-nn.github.io/orbit-creator-match-demo/)。
产品版独立部署为 `https://你的服务.onrender.com/product/`，不会覆盖作品集链接。

## 1. 你需要准备的账号

- [Render](https://dashboard.render.com/)：用自己的账号注册，连接存放 Orbit 的
  GitHub 仓库。授权时只选这个仓库，不需要开放所有私有仓库。
- [Google Cloud](https://console.cloud.google.com/)：创建专用项目，例如 `Orbit`。
  项目 ID 以控制台实际分配为准。
- [Google AI Studio](https://aistudio.google.com/apikey)：导入同一个 Cloud 项目，
  创建 Gemini API Key。Google Cloud 与 AI Studio 管理的是同一项目下的资源。
- 用于测试收发的 Gmail 邮箱；先使用自己控制的邮箱，不联系真实创作者。
- 如需完整密码找回与团队邀请，准备 Resend 账号及可验证的发信域名。
  这与通过 Gmail 发送创作者邀约是两套不同的用途。

注册、条款确认、验证码、付款及 Google 授权由你本人完成。不要把 API Key、
OAuth Client Secret、密码、恢复码或付款信息发到聊天或提交至仓库。

## 2. 费用与部署规格

当前模板使用 Docker、单实例、`0.5c-512mb` 和 1 GB 持久磁盘。按 2026-10-15
核对的官方价格，计算资源约 $7/月，磁盘 $0.25/GB/月，基础约 $7.25/月；
税费、额外流量、Gemini 用量、其他服务及平台账单以结算页为准。
**目前没有创建付费资源。确认费用后再创建服务。**

SQLite 必须放在 `/var/lib/orbit/orbit.sqlite`。免费服务的临时文件系统不能作为
产品数据库。此方案适合早期受控试用：仅运行一个实例，部署时会短暂中断服务；
扩大使用范围前需评估托管数据库、队列、备份及多实例方案。

## 3. 配置 Google 项目

1. 在 Cloud 项目中启用 **YouTube Data API v3** 和 **Gmail API**。
2. 为 YouTube 创建独立 API Key，API 限制只允许 YouTube Data API v3。
   服务器调用不能使用浏览器 HTTP referrer 限制；若增加 IP 限制，须匹配托管
   平台的实际出口地址。
3. 在 AI Studio 创建 Gemini Key，保留对应 API 的安全限制。先确认项目地区、
   模型访问和配额；模板默认 `gemini-2.5-flash`，实际可用性须通过真实请求验证。
4. 配置 OAuth 应用品牌信息、支持邮箱和测试用户。创建 **Web application** 类型
   OAuth Client；服务地址确定后填入精确回调：
   `https://你的服务.onrender.com/api/google/callback`。
5. Gmail 使用 `gmail.send`（发送）和 `gmail.readonly`（回信同步）。后者是受限
   权限；公开发布需要按 Google 规则完成验证及适用的安全评估。开发测试模式不能
   当作公开发布许可。不要要求体验用户绕过 Google 的安全警告。
6. 开启账单告警并查看 API 配额。告警不等于消费硬上限，不能保证自动停止计费。

## 4. 部署到 Render

1. 新建 Blueprint，选择这个仓库和 `codex/product-launch` 分支，读取根目录
   `render.yaml`。此分支尚在 PR 中，不能误选仍保留旧演示代码的 `main`。
2. 检查服务规格和费用。模板已配置 Docker、单实例、持久磁盘、健康检查和
   CI 成功后自动部署。先不添加自定义域名。
3. 在 Render 的环境变量设置中配置以下值；不要改前端源码：

   | 变量 | 内容 |
   | --- | --- |
   | `ENCRYPTION_KEY` | 随机的 32 字节十六进制密钥，共 64 个字符 |
   | `YOUTUBE_API_KEY` | YouTube 专用 Key |
   | `GEMINI_API_KEY` | AI Studio 创建的 Key |
   | `GEMINI_MODEL` | 已验证支持视频输入的模型 ID |
   | `GOOGLE_CLIENT_ID` | Web OAuth Client ID |
   | `GOOGLE_CLIENT_SECRET` | 对应 Client Secret |
   | `RESEND_API_KEY` | 账户邮件服务 Key；暂不启用时留空 |
   | `EMAIL_FROM` | 已验证域名下的发件人；暂不启用时留空 |

   加密密钥可在自己的终端生成，输出只保存到密码管理器和 Render：

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   后续不能随意更换此密钥，否则已保存的 Gmail Token 无法解密。

4. 应用自动读取 Render 的 `RENDER_EXTERNAL_URL`，不用预先猜服务域名。
   如果以后启用自定义域名，设置 `APP_URL=https://你的域名`，并更新 OAuth 回调。
5. 访问 `/healthz` 确认启动，再打开 `/product/` 注册自己的产品账号。在 Settings
   中由你本人授权 Gmail。Google/Render 账号与 Orbit 的产品账号彼此独立。

## 5. 上线验收，全部通过后才能对外使用

- 真实导入一个 YouTube 频道；核对头像、近期视频、公开指标和数据日期。
- 真实运行 Gemini 视频分析；逐条点击时间戳检查内容，不使用演示数据替代。
  默认先分析 2 位创作者；确认效果与实际用量后，再选择 4／8 位批量或继续下一页。
  每批数量限制不是消费硬上限。
- 手机执行引导、滑动、撤销、稍后再看、多选对比、Brief 编辑/下载/批准；
  用实际 iPhone Safari 验证自动定位、键盘弹起和关闭抽屉。
- 给自己控制的邮箱发送一次批准后的邮件，检查附件，再回复并同步到 Orbit。
- 验证密码找回、邀请、撤销成员权限和跨账号数据隔离。
- 重启服务后确认数据仍在；完成数据库备份、恢复演练和站外备份存储配置。
- 核对错误提示、配额不足和部分分析失败重试；确认日志里没有密钥或邮件正文。

代码测试使用注入的外部服务替身，不能证明真实 API、OAuth、邮件送达或托管已通过。
这些验收尚未完成，当前状态仍是“产品代码已实现，等待账号接入和线上验收”。

## 官方依据

- [Render Blueprint 字段与方案 ID](https://render.com/docs/blueprint-spec)
- [Render 价格](https://render.com/pricing)、[持久磁盘限制](https://render.com/docs/disks)
- [Render 提供的服务地址变量](https://render.com/docs/environment-variables#render-external-url)
- [Gemini API Key](https://ai.google.dev/gemini-api/docs/api-key)、[模型生命周期](https://ai.google.dev/gemini-api/docs/deprecations)
- [YouTube Data API 准备工作](https://developers.google.com/youtube/v3/getting-started)
- [Google Web OAuth](https://developers.google.com/identity/protocols/oauth2/web-server)、[Gmail 权限分级](https://developers.google.com/workspace/gmail/api/auth/scopes)
