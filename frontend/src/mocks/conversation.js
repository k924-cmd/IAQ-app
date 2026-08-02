const replies = [
  { match: /空气|pm2\.5|二氧化碳|湿度/i, text: '这是 UI 演示数据：当前 PM2.5 为 12 μg/m³，空气状态良好。' },
  { match: /窗|净化器|油烟机|设备|开启|关闭/i, text: '设备操作目前使用本地 Mock，不会连接真实设备。你可以在“设备”页面体验界面交互。' },
  { match: /你好|嗨|在吗/i, text: '你好，我是 Luna。新的 AI 对话框架正在重建，现在由本地 Mock 陪你体验界面。' }
];

export async function getMockReply(message) {
  await new Promise(resolve => setTimeout(resolve, 240));
  return replies.find(item => item.match.test(message))?.text
    || '我已收到你的消息。当前仅保留界面演示，不会执行后端任务或控制真实设备。';
}
