const express = require('express');
const router = express.Router();
const pm2Service = require('../services/pm2Service');
const dbService = require('../services/dbService');
const systemService = require('../services/systemService');

router.get('/', async (req, res) => {
  try {
    const status = await pm2Service.getStatus();
    const staticInfo = await systemService.getStaticInfo();
    const dynamicInfo = await systemService.getDynamicInfo();
    
    res.render('index', { 
      processes: status, 
      error: null,
      systemInfo: {
        ...staticInfo,
        ...dynamicInfo
      }
    });
  } catch (error) {
    const savedStatus = await dbService.getStatus();
    const staticInfo = await systemService.getStaticInfo();
    const dynamicInfo = await systemService.getDynamicInfo();
    
    res.render('index', { 
      processes: savedStatus, 
      error: `获取实时状态时出错: ${error.message}。显示已保存的状态。`,
      systemInfo: {
        ...staticInfo,
        ...dynamicInfo
      }
    });
  }
});

router.post('/command', async (req, res) => {
  const { action, processName } = req.body;
  try {
    await pm2Service.executeCommand(action, processName);
    const newStatus = await pm2Service.getStatus();
    await dbService.saveStatus(newStatus);
    res.json({ success: true, processes: newStatus });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `执行命令失败: ${error.message}` 
    });
  }
});

module.exports = router;