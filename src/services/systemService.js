const os = require('os');
const osUtils = require('os-utils');

class SystemService {
  constructor() {
    this.staticInfo = null;
    this.dynamicInfo = null;
    this.lastUpdate = 0;
    this.updateInterval = 10000; // 10秒更新间隔
  }

  async getStaticInfo() {
    if (!this.staticInfo) {
      try {
        const cpus = os.cpus();
        const totalmem = os.totalmem();
        
        if (!cpus || !cpus.length || !totalmem) {
          throw new Error('无法获取系统信息');
        }

        this.staticInfo = {
          cpuModel: cpus[0].model || '未知',
          cpuCores: cpus.length,
          totalMemory: this.formatMemory(totalmem)
        };
      } catch (error) {
        console.error('获取静态系统信息失败:', error);
        this.staticInfo = {
          cpuModel: '未知',
          cpuCores: 0,
          totalMemory: 0
        };
      }
    }
    return this.staticInfo;
  }

  async getDynamicInfo() {
    const now = Date.now();
    if (!this.dynamicInfo || (now - this.lastUpdate) > this.updateInterval) {
      try {
        const cpuUsage = await this.getCPUUsage();
        const memoryUsage = await this.getMemoryUsage();

        this.dynamicInfo = {
          cpuUsage: this.formatPercentage(cpuUsage),
          memoryUsage: this.formatPercentage(memoryUsage)
        };
        this.lastUpdate = now;
      } catch (error) {
        console.error('获取动态系统信息失败:', error);
        this.dynamicInfo = {
          cpuUsage: 0,
          memoryUsage: 0
        };
      }
    }
    return this.dynamicInfo;
  }

  formatMemory(bytes) {
    if (!bytes || isNaN(bytes) || bytes <= 0) return 0;
    return Math.round(bytes / (1024 * 1024 * 1024) * 100) / 100; // GB
  }

  formatPercentage(value) {
    if (isNaN(value) || value < 0) return 0;
    if (value > 100) return 100;
    return Math.round(value * 100) / 100;
  }

  async getCPUUsage() {
    return new Promise((resolve) => {
      try {
        osUtils.cpuUsage(value => {
          resolve(value * 100);
        });
      } catch (error) {
        console.error('获取CPU使用率失败:', error);
        resolve(0);
      }
    });
  }

  getMemoryUsage() {
    try {
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();
      
      if (!totalMemory || totalMemory <= 0) {
        return 0;
      }
      
      return ((totalMemory - freeMemory) / totalMemory) * 100;
    } catch (error) {
      console.error('获取内存使用率失败:', error);
      return 0;
    }
  }
}

module.exports = new SystemService();