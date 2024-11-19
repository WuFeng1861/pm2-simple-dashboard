const pm2 = require('pm2');

class PM2Service {
  constructor() {
    this.isConnected = false;
  }

  async ensureConnected() {
    if (!this.isConnected) {
      return new Promise((resolve, reject) => {
        pm2.connect((err) => {
          if (err) {
            this.isConnected = false;
            reject(err);
          } else {
            this.isConnected = true;
            resolve();
          }
        });
      });
    }
    return Promise.resolve();
  }

  async checkConnection() {
    if (this.isConnected) {
      // 简单的连接检查：尝试列出进程
      try {
        await new Promise((resolve, reject) => {
          pm2.list((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        return true;
      } catch (error) {
        this.isConnected = false;
        return false;
      }
    }
    return false;
  }

  async getStatus() {
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        await this.ensureConnected();
      }

      return new Promise((resolve, reject) => {
        pm2.list((err, list) => {
          if (err) {
            this.isConnected = false;
            reject(err);
          } else {
            resolve(list);
          }
        });
      });
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  async executeCommand(action, processName = 'all') {
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        await this.ensureConnected();
      }

      return new Promise((resolve, reject) => {
        const handler = (err, result) => {
          if (err) {
            this.isConnected = false;
            reject(err);
          } else {
            resolve(result);
          }
        };

        switch (action) {
          case 'start':
            pm2.start(processName, handler);
            break;
          case 'restart':
            pm2.restart(processName, handler);
            break;
          case 'stop':
            pm2.stop(processName, handler);
            break;
          default:
            reject(new Error('Invalid action'));
        }
      });
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  // 添加析构方法，用于应用关闭时断开连接
  cleanup() {
    if (this.isConnected) {
      pm2.disconnect();
      this.isConnected = false;
    }
  }
}

const pm2Service = new PM2Service();

// 添加进程退出时的清理
process.on('SIGINT', () => {
  pm2Service.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  pm2Service.cleanup();
  process.exit(0);
});

module.exports = pm2Service;