# 短剧互动播放 Demo

基于 Expo + React Native 构建的短剧互动播放应用，通过内容理解结果驱动用户互动体验。

## 功能特性

- 🎬 双短剧内容库：包含两部完整短剧，支持剧集列表、分集选择与播放
- ✨ 高光点互动：在视频指定“爽点”“反转点”“名场面”“撒糖”时段自动触发右侧浮动互动按钮
- 👆 丰富的交互动画：点击高光按钮后触发粒子特效、弹幕贴纸、连击计数
- 🤔 剧情节点选择：在关键剧情节点暂停并弹出选择弹窗，引导用户参与剧情
- 🎁 支线剧情与奖励：支持进入支线剧情，完成后展示奖励图标与特效

## 技术栈

### 移动端
- **Expo SDK** 54.0.0
- **React** 19.1.0
- **React Native** 0.81.5
- **@react-navigation/native** - 页面导航与路由
- **expo-video** - 视频播放组件
- **React Native Animated** - 交互动画

### 数据管理
- 本地 JS 配置文件管理剧集、高光点与剧情节点数据

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm start
```

### 运行平台
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 项目结构

```
short-drama-app/
├── assets/
│   ├── covers/          # 剧集封面
│   ├── icons/           # 高光点互动贴纸
│   └── videos/          # 短剧视频（主剧 + 支线）
├── docs/
│   └── technical-design.md  # 技术设计文档
├── src/
│   ├── data/
│   │   ├── dramas.js       # 剧集数据
│   │   ├── highlights.js   # 高光点配置
│   │   └── interactions.js # 剧情节点配置
│   └── screens/
│       ├── HomeScreen.js       # 首页 - 剧集列表
│       ├── EpisodesScreen.js   # 分集列表页
│       └── PlayerScreen.js     # 播放页
├── App.js                 # 应用入口与导航配置
├── app.json               # Expo 配置
└── package.json
```

## 高光点触发机制

1. **数据加载**：播放时根据剧集 ID 加载该集所有高光点配置
2. **时间匹配**：监听播放时间 `currentTime`，动态匹配当前是否在某个高光点区间内
3. **UI 渲染**：匹配成功后在右侧展示对应互动按钮，支持点击特效与连击
4. **可见性控制**：用户点击叉号可手动关闭高光点

## 扩展规划

- [ ] 将本地配置升级为后端 API 下发
- [ ] 接入 ASR 获取带时间戳的台词文本
- [ ] 接入大模型实现自动高光点标注
- [ ] 增加互动行为埋点与分析
- [ ] 支持 AIGC 插片与剧情分叉

## License

MIT
