# 德泰书院预约系统

## 项目概述

德泰书院预约系统是一个纯前端静态网站，使用 HTML/CSS/JavaScript 构建，数据存储在浏览器 localStorage 中。无需后端服务器，可部署到任何静态托管平台。

## 功能特性

### 用户端
- 📅 **日历预约**：可视化日历选择预约日期
- 📚 **双类型预约**：支持"活动预约"和"自习预约"
- 📝 **信息填写**：姓名、学号必填，活动需填写内容和承办部门
- ✅ **预约确认**：提交前预览所有信息
- 📱 **二维码核销**：预约成功后生成核销二维码

### 管理端
- 🔐 **密码保护**：管理员密码登录
- 📊 **数据统计**：总预约数、今日预约、待核销数
- 🔍 **筛选搜索**：按日期、类型、姓名/学号筛选
- 👁️ **详情查看**：查看完整预约信息
- 🗑️ **预约删除**：管理员可删除预约
- 📲 **扫码核销**：输入核销码完成到店验证

### 智能限制
- ⛔ **周末不可约**：周六周日自动禁用
- 🎌 **节假日不可约**：内置2026年法定节假日
- 📅 **开放日期**：2026年5月6日起，周一至周五 17:00-21:00
- 🔢 **人数限制**：每天最多20个预约

## 文件结构

```
detaishuyuan-booking/
├── index.html          # 主页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── app.js          # 应用逻辑
└── README.md           # 本文件
```

## 部署指南

### 方法一：GitHub Pages（免费 + 自定义域名）

1. **创建 GitHub 仓库**
   - 登录 GitHub，创建新仓库（如 `detaishuyuan-booking`）
   - 设置为 Public

2. **上传代码**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/detaishuyuan-booking.git
   git push -u origin main
   ```

3. **启用 GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main"，文件夹选择 "/ (root)"
   - 保存后等待几分钟，访问 `https://你的用户名.github.io/detaishuyuan-booking`

4. **绑定自定义域名**
   - 购买域名（阿里云、腾讯云、GoDaddy 等）
   - 在域名管理后台添加 CNAME 记录：
     - 主机记录：`www` 或 `@`
     - 记录值：`你的用户名.github.io`
   - 在仓库根目录创建 `CNAME` 文件，内容为你的域名（如 `www.detaishuyuan.com`）
   - 在 GitHub Pages 设置中填入自定义域名并保存

### 方法二：Netlify（免费 + 自定义域名）

1. 访问 [netlify.com](https://netlify.com) 注册账号
2. 点击 "Add new site" → "Deploy manually"
3. 拖拽项目文件夹上传
4. 在 Site settings → Domain management 中添加自定义域名
5. 按提示在域名服务商处配置 DNS 记录

### 方法三：Vercel（免费 + 自定义域名）

1. 访问 [vercel.com](https://vercel.com) 注册账号
2. 导入 GitHub 仓库或拖拽上传
3. 在 Project Settings → Domains 中添加自定义域名
4. 按提示配置 DNS

### 方法四：腾讯云/阿里云对象存储（国内访问快）

1. 购买对象存储服务（COS/OSS）
2. 创建存储桶，开启静态网站托管
3. 上传所有文件
4. 绑定自定义域名（需备案）
5. 配置 CDN 加速（可选）

## 自定义配置

编辑 `js/app.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
    OPEN_DAYS: [1, 2, 3, 4, 5],        // 开放日（1=周一，0=周日）
    OPEN_TIME: '17:00-21:00',          // 开放时间显示文本
    START_DATE: '2026-05-06',          // 开始预约日期
    ADMIN_PASSWORD: 'admin123',        // 管理员密码（建议修改）
    MAX_BOOKINGS_PER_DAY: 20,          // 每天最大预约数
    HOLIDAYS: [                        // 法定节假日列表
        '2026-01-01',
        // ... 更多节假日
    ]
};
```

## 注意事项

1. **数据存储**：当前使用 localStorage，数据保存在用户浏览器中。如需多设备同步，建议后续接入后端数据库。

2. **管理员密码**：默认密码为 `admin123`，部署后请务必修改。

3. **二维码**：当前为模拟二维码，实际使用建议集成 [qrcode.js](https://github.com/soldair/node-qrcode) 生成真实二维码。

4. **浏览器兼容性**：支持 Chrome、Firefox、Safari、Edge 等现代浏览器。

5. **响应式设计**：已适配手机、平板、电脑等各种屏幕尺寸。

## 技术栈

- HTML5
- CSS3（Grid、Flexbox、自定义属性）
- Vanilla JavaScript（ES6+）
- 无框架依赖

## 许可证

MIT License
