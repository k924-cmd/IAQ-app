const entries = [
  {
    topic: "pm25",
    pattern: /PM2\.5|PM25|细颗粒物/i,
    content: "PM2.5 是空气动力学当量直径不大于 2.5 微米的细颗粒物指标。它可能来自燃烧、烹饪烟雾和室外污染渗入。判断当前水平时，应使用带观测时间和来源的可信环境快照。",
  },
  {
    topic: "co2",
    pattern: /CO2|二氧化碳/i,
    content: "室内二氧化碳通常会因人员呼吸、燃烧或烹饪活动而累积；空间较密闭、人员增多或通风不足时，浓度更容易升高。具体当前数值必须来自带观测时间和来源的可信环境快照。",
  },
  {
    topic: "humidity",
    pattern: /湿度|潮湿|干燥/,
    content: "相对湿度描述空气中水汽相对于同温度下饱和值的比例。长期过干可能带来干燥体感，长期过湿可能增加结露和霉菌风险；应结合可靠读数、季节和房间情况判断。",
  },
  {
    topic: "temperature",
    pattern: /温度|冷热|太热|太冷/,
    content: "室内温度会受到室外天气、日照、人员、烹饪和设备运行等因素影响。舒适感还与湿度、气流和个人差异有关；当前温度应以带时间与来源的可信读数为准。",
  },
  {
    topic: "ventilation",
    pattern: /通风|换气/,
    content: "通风可以稀释室内积聚的二氧化碳、气味和部分污染物，但是否适合开窗还要考虑室外空气、天气和人身安全。智能窗户的状态改变会经过设备能力、状态版本与策略校验后执行，知识说明本身不会触发设备动作。",
  },
  {
    topic: "air_purifier",
    pattern: /空气净化器|净化器/,
    content: "空气净化器通常通过风机让空气经过滤材，以减少适用粒径范围内的颗粒物。它不能替代所有通风需求；滤材维护、适用面积和设备说明都会影响使用效果。",
  },
  {
    topic: "smart_window",
    pattern: /智能窗户|窗户/,
    content: "智能窗户在 V1 中支持打开和关闭，直接执行前仍会完成设备能力、状态版本与策略校验。是否适合开窗应结合室外环境、天气和安全条件，知识说明本身不会触发设备动作。",
  },
  {
    topic: "range_hood",
    pattern: /抽油烟机|油烟机/,
    content: "抽油烟机用于在烹饪时捕集并排出油烟和部分污染物。一般应按设备说明及时开启并维护滤网或集油部件；知识说明不代表设备已经启动。",
  },
  {
    topic: "simulation_optimization",
    pattern: /Mock|Replay|模拟优化|舒适优先|均衡自动|低碳优先/i,
    content: "V1 的舒适优先、均衡自动和低碳优先都属于模拟优化，只允许 Mock 或 Replay 产生候选动作。候选仍需经过设备能力、状态版本和策略校验，不能据此声称真实健康、舒适或节能收益。",
  },
  {
    topic: "general_safety",
    pattern: /安全|危险|异味|烟雾|健康/,
    content: "空气与设备知识只能提供一般信息，不能诊断疾病或保证环境绝对安全。若出现明显急性不适、浓烟、疑似中毒或危险暴露，应先离开风险环境并联系当地紧急服务或专业人员。",
  },
];

export function lookupKnowledge(message) {
  const entry = entries.find((candidate) => candidate.pattern.test(message));
  if (entry) return { topic: entry.topic, content: entry.content };
  return {
    topic: "unknown",
    content: "本地 V1 知识库暂未覆盖这个主题。我可以介绍 PM2.5、二氧化碳、湿度、温度、通风、空气净化器、智能窗户、抽油烟机和 Mock/Replay 模拟优化；未知主题不会触发设备动作或生成当前状态结论。",
  };
}
