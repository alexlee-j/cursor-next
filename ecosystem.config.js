module.exports = {
  apps: [{
    name: "blog-next",
    script: "node_modules/next/dist/bin/next", // 直接调用Next.js二进制文件
    args: "start --port 3000", // 明确指定端口
    instances: "max", // 使用所有可用CPU核心
    exec_mode: "cluster", // 启用集群模式提高性能
    env: {
      NODE_ENV: "production",
    },
    // 日志配置
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    merge_logs: true,
    output: "./logs/out.log",
    error: "./logs/err.log",
    // 自动重启策略
    max_memory_restart: "500M",
    autorestart: true,
    watch: false // 生产环境关闭文件监控
  }]
};