module.exports = {
  apps: [{
    name: "TiMiFood-Server",
    script: "./backend/server.js",
    instances: "max", // Chạy trên tất cả các core CPU (Cluster mode)
    exec_mode: "cluster",
    watch: false,     // Tắt watch khi chạy production
    max_memory_restart: '1G', // Khởi động lại nếu ngốn quá 1GB RAM
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}
