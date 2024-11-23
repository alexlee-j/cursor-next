// 分类存放敏感词
export const sensitiveWords = {
  spam: [
    "广告",
    "优惠",
    "促销",
    "代理",
    "招商",
    "加盟",
    "赚钱",
    "致富",
    "免费",
    "特价",
    "便宜",
    "批发",
    "代购",
    "微商",
    "兼职",
    "招聘",
    "加微信",
    "加qq",
    "加群",
    "联系方式",
    "电话咨询",
  ],
  links: [
    "http://",
    "https://",
    "www.",
    ".com",
    ".cn",
    ".net",
    ".org",
    "t.cn",
    "url.cn",
    "weixin.qq",
    "douyin.com",
    "taobao",
    "tmall",
    "jd.com",
  ],
  gambling: [
    "赌博",
    "博彩",
    "彩票",
    "赌场",
    "投注",
    "赌钱",
    "百家乐",
    "赌具",
    "赌资",
    "六合彩",
    "时时彩",
    "北京赛车",
    "快三",
    "炸金花",
    "斗牛",
    "扎金花",
    "赌徒",
  ],
  abuse: [
    "傻逼",
    "垃圾",
    "废物",
    "脑残",
    "白痴",
    "智障",
    "贱",
    "滚",
    "去死",
    "你妈",
    "尼玛",
    "特么",
    "他妈",
    "踏马",
    "我日",
    "卧槽",
    "我靠",
    "煞笔",
    "沙比",
  ],
  adult: [
    "色情",
    "约炮",
    "一夜情",
    "援交",
    "性服务",
    "小姐",
    "上门",
    "按摩",
    "特殊服务",
    "包夜",
    "楼凤",
    "兼职妹",
  ],
  fraud: [
    "诈骗",
    "钓鱼",
    "欺诈",
    "假冒",
    "仿制",
    "盗号",
    "盗窃",
    "钱包",
    "支付宝",
    "微信支付",
    "银行卡",
    "转账",
    "中奖",
    "抽奖",
    "免费领",
  ],
  illegal: [
    "枪支",
    "弹药",
    "毒品",
    "麻醉",
    "致幻",
    "迷药",
    "催情",
    "假证",
    "证件",
    "代办",
    "代开",
    "发票",
    "假钱",
    "假币",
  ],
  political: [],
  discrimination: [
    "地域黑",
    "种族",
    "民族",
    "歧视",
    "地域",
    "地狱",
    "洋人",
    "外国",
  ],
  custom: ["举报", "投诉", "差评", "退款", "骗子", "欺骗", "造假", "虚假"],
};

// 合并所有敏感词为一个集合，用于快速查找
export const sensitiveWordsSet = new Set(Object.values(sensitiveWords).flat());

// 检查文本是否包含敏感词，返回匹配到的敏感词
export function checkSensitiveWords(text: string): string[] {
  const matches: string[] = [];
  const lowerText = text.toLowerCase();

  for (const word of sensitiveWordsSet) {
    if (lowerText.includes(word.toLowerCase())) {
      matches.push(word);
    }
  }

  return matches;
}

// 检查文本的敏感程度
export function getSensitivityLevel(text: string): {
  level: "safe" | "suspicious" | "dangerous";
  matches: string[];
  categories: string[];
} {
  const matches: string[] = [];
  const categories: string[] = [];

  // 检查每个类别的敏感词
  for (const [category, words] of Object.entries(sensitiveWords)) {
    const categoryMatches = words.filter((word) =>
      text.toLowerCase().includes(word.toLowerCase())
    );

    if (categoryMatches.length > 0) {
      matches.push(...categoryMatches);
      categories.push(category);
    }
  }

  // 根据匹配数量和类别判断敏感程度
  if (matches.length === 0) {
    return { level: "safe", matches: [], categories: [] };
  } else if (matches.length === 1 && !categories.includes("abuse")) {
    return { level: "suspicious", matches, categories };
  } else {
    return { level: "dangerous", matches, categories };
  }
}

// 变体匹配规则
const variantPatterns = {
  // 数字替换字母
  number_letter: [
    { pattern: /[0o零]/gi, replace: "o" },
    { pattern: /[1一壹]/gi, replace: "l" },
    { pattern: /[2二贰]/gi, replace: "z" },
    { pattern: /[3三叁]/gi, replace: "e" },
    { pattern: /[4四肆]/gi, replace: "a" },
    { pattern: /[5五伍]/gi, replace: "s" },
    { pattern: /[6六陆]/gi, replace: "b" },
    { pattern: /[7七柒]/gi, replace: "t" },
    { pattern: /[8八捌]/gi, replace: "b" },
    { pattern: /[9九玖]/gi, replace: "g" },
  ],

  // 特殊字符
  special_chars: [
    { pattern: /[!！@#\$%\^&\*\(\)]/g, replace: "" },
    { pattern: /[\s\.。,，_\-+＋～~]/g, replace: "" },
  ],

  // 常见谐音
  homophones: [
    { pattern: /[槍]/g, replace: "枪" },
    { pattern: /[機机]/g, replace: "机" },
    { pattern: /[黃黄]/g, replace: "黄" },
    { pattern: /[藥药]/g, replace: "药" },
    { pattern: /[妳你]/g, replace: "你" },
    { pattern: /[壊坏]/g, replace: "坏" },
    // ... 更多谐音匹配
  ],
};

// 拼音匹配规则
const pinyinMap = new Map([
  ["gun", ["棍", "滚"]],
  ["cao", ["草", "操"]],
  ["si", ["死", "四"]],
  ["sha", ["杀", "傻"]],
  ["du", ["毒", "赌"]],
  // ... 更多拼音映射
]);

// 敏感度级别定义
export enum SensitivityLevel {
  SAFE = "safe",
  LOW = "low", // 轻微敏感
  MEDIUM = "medium", // 中度敏感
  HIGH = "high", // 高度敏感
  EXTREME = "extreme", // 极度敏感
}

// 处理策略配置
export const moderationStrategies = {
  [SensitivityLevel.SAFE]: {
    action: "approve",
    needsReview: false,
    autoNotify: false,
  },
  [SensitivityLevel.LOW]: {
    action: "approve",
    needsReview: true,
    autoNotify: false,
  },
  [SensitivityLevel.MEDIUM]: {
    action: "pending",
    needsReview: true,
    autoNotify: true,
  },
  [SensitivityLevel.HIGH]: {
    action: "reject",
    needsReview: true,
    autoNotify: true,
  },
  [SensitivityLevel.EXTREME]: {
    action: "reject",
    needsReview: true,
    autoNotify: true,
    banUser: true,
  },
};

// 规范化文本
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();

  // 应用所有变体匹配规则
  for (const category of Object.values(variantPatterns)) {
    for (const { pattern, replace } of category) {
      normalized = normalized.replace(pattern, replace);
    }
  }

  return normalized;
}

// 检查拼音匹配
function checkPinyinMatch(text: string): string[] {
  const matches: string[] = [];
  for (const [pinyin, chars] of pinyinMap.entries()) {
    if (text.includes(pinyin)) {
      matches.push(...chars);
    }
  }
  return matches;
}

// 增强的敏感词检查
export function checkContent(text: string): {
  level: SensitivityLevel;
  matches: string[];
  categories: string[];
  matchDetails: {
    original: string[];
    variants: string[];
    pinyin: string[];
  };
} {
  const normalizedText = normalizeText(text);
  const originalMatches = checkSensitiveWords(text);
  const variantMatches = checkSensitiveWords(normalizedText);
  const pinyinMatches = checkPinyinMatch(normalizedText);

  const allMatches = [
    ...new Set([...originalMatches, ...variantMatches, ...pinyinMatches]),
  ];

  // 确定敏感级别
  let level = SensitivityLevel.SAFE;
  const categories: string[] = [];

  for (const [category, words] of Object.entries(sensitiveWords)) {
    const categoryMatches = allMatches.filter((match) => words.includes(match));
    if (categoryMatches.length > 0) {
      categories.push(category);

      // 根据类别和匹配数量确定级别
      if (category === "illegal" || category === "abuse") {
        level = SensitivityLevel.HIGH;
      } else if (categoryMatches.length > 2) {
        level = SensitivityLevel.MEDIUM;
      } else if (level === SensitivityLevel.SAFE) {
        level = SensitivityLevel.LOW;
      }
    }
  }

  return {
    level,
    matches: allMatches,
    categories,
    matchDetails: {
      original: originalMatches,
      variants: variantMatches.filter((m) => !originalMatches.includes(m)),
      pinyin: pinyinMatches.filter(
        (m) => !originalMatches.includes(m) && !variantMatches.includes(m)
      ),
    },
  };
}

// 获取处理策略
export function getModerationStrategy(result: ReturnType<typeof checkContent>) {
  const strategy = moderationStrategies[result.level];
  return {
    ...strategy,
    reason:
      result.matches.length > 0
        ? `包含${result.categories.join("、")}类敏感词：${result.matches.join(
            "、"
          )}`
        : undefined,
  };
}
