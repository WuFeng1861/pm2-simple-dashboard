const fs = require('fs/promises');
const path = require('path');
const { DB_FILE } = require('../config');

class DBService {
  async ensureDbDir() {
    const dbDir = path.dirname(DB_FILE);
    try {
      await fs.access(dbDir);
    } catch {
      await fs.mkdir(dbDir, { recursive: true });
    }
  }

  async saveStatus(newStatus) {
    await this.ensureDbDir();
    
    // 获取当前保存的状态
    let currentStatus = await this.getStatus();
    
    // 创建进程 ID 到进程映射的查找表
    const newStatusMap = new Map(newStatus.map(proc => [proc.pm_id, proc]));
    
    // 更新或保留进程状态
    currentStatus = currentStatus.map(savedProc => {
      const newProc = newStatusMap.get(savedProc.pm_id);
      if (!newProc) {
        // 如果进程在新状态中不存在，将其标记为已停止
        return {
          ...savedProc,
          pm2_env: {
            ...savedProc.pm2_env,
            status: 'stopped'
          },
          monit: {
            cpu: 0,
            memory: 0
          }
        };
      }
      return newProc;
    });

    // 添加新出现的进程
    newStatus.forEach(newProc => {
      if (!currentStatus.some(proc => proc.pm_id === newProc.pm_id)) {
        currentStatus.push(newProc);
      }
    });

    // 保存更新后的状态
    await fs.writeFile(DB_FILE, JSON.stringify(currentStatus, null, 2));
    return currentStatus;
  }

  async getStatus() {
    try {
      await this.ensureDbDir();
      const data = await fs.readFile(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}

module.exports = new DBService();