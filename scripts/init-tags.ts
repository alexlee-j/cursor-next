import { prisma } from "../lib/db";

const tags = [
  // 编程语言
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Dart",
  "C#",
  "Shell",
  "SQL",

  // 前端技术
  "React",
  "Vue",
  "Angular",
  "Next.js",
  "Nuxt.js",
  "Svelte",
  "HTML",
  "CSS",
  "Sass",
  "Less",
  "Tailwind",
  "Bootstrap",
  "Material UI",
  "Webpack",
  "Vite",
  "Redux",
  "Zustand",
  "GraphQL",
  "PWA",
  "WebAssembly",
  "Three.js",
  "WebGL",

  // 后端技术
  "Node.js",
  "Express",
  "Nest.js",
  "Django",
  "Flask",
  "Spring Boot",
  "Laravel",
  "FastAPI",
  "Ruby on Rails",
  "ASP.NET",
  "Gin",
  "Echo",

  // 数据库
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Elasticsearch",
  "SQLite",
  "Oracle",
  "SQL Server",
  "Firebase",
  "Supabase",
  "Prisma",
  "Sequelize",

  // DevOps & 云服务
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Vercel",
  "Netlify",
  "CI/CD",
  "Jenkins",
  "GitHub Actions",
  "GitLab CI",
  "Linux",
  "Nginx",

  // 移动开发
  "iOS",
  "Android",
  "React Native",
  "Flutter",
  "Ionic",
  "小程序",
  "Electron",
  "Tauri",
  "移动端适配",

  // 架构 & 设计
  "微服务",
  "架构设计",
  "设计模式",
  "DDD",
  "RESTful",
  "gRPC",
  "WebSocket",
  "性能优化",
  "重构",
  "代码质量",
  "测试",
  "安全",

  // AI & 机器学习
  "机器学习",
  "深度学习",
  "人工智能",
  "TensorFlow",
  "PyTorch",
  "OpenAI",
  "自然语言处理",
  "计算机视觉",
  "数据分析",
  "大数据",

  // 区块链 & Web3
  "区块链",
  "Web3",
  "智能合约",
  "以太坊",
  "Solidity",
  "NFT",
  "DeFi",
  "加密货币",
  "去中心化",

  // 工具 & 效率
  "Git",
  "VSCode",
  "Vim",
  "Terminal",
  "命令行",
  "正则表达式",
  "开发工具",
  "效率工具",
  "开源项目",

  // 软技能 & 其他
  "项目管理",
  "团队协作",
  "技术写作",
  "职业发展",
  "面试",
  "算法",
  "数据结构",
  "系统设计",
  "最佳实践",
  "教程",
  "经验分享",
];

async function initTags() {
  console.log("开始初始化标签...");

  try {
    // 批量创建标签，使用 createMany 提高效率
    const result = await prisma.tag.createMany({
      data: tags.map((name) => ({ name })),
      skipDuplicates: true, // 跳过已存在的标签
    });

    console.log(`成功创建 ${result.count} 个标签`);

    // 获取所有标签数量
    const totalTags = await prisma.tag.count();
    console.log(`数据库中共有 ${totalTags} 个标签`);
  } catch (error) {
    console.error("初始化标签失败:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行初始化
initTags()
  .then(() => console.log("标签初始化完成"))
  .catch(console.error);
