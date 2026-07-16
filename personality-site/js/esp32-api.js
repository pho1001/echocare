/**
 * ESP32 EchoCare 设备 API 通信层
 * 
 * 当你在浏览器中访问 ESP32 的 IP 地址时（例如 http://192.168.1.100），
 * 此模块自动检测并通过 REST API 读写设备上的智能体配置。
 * 
 * API 端点（跑在 ESP32 板上，免费，不需任何外部服务器）:
 *   GET  /api/config  → 读取当前配置
 *   POST /api/config  → 写入配置
 *   GET  /api/status  → 设备状态
 */

const Esp32Api = {
  _deviceIp: null,
  _available: false,

  /**
   * 检测是否连接到了 ESP32 设备
   * 通过检查当前 URL 是否包含本地 IP 地址来判断
   */
  detect() {
    const host = window.location.hostname;
    // 匹配局域网IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x) 或 .local 域名
    const localIpRegex = /^(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;
    if (localIpRegex.test(host) || host.endsWith('.local')) {
      this._deviceIp = host;
      this._available = true;
      console.log('[Esp32Api] 检测到设备: http://' + host);
      this._updateUi();
      return true;
    }

    // 也可以通过手动设置 IP 来连接
    const savedIp = localStorage.getItem('echocare_device_ip');
    if (savedIp) {
      this._deviceIp = savedIp;
      this._available = true;
      console.log('[Esp32Api] 使用已保存的设备 IP: ' + savedIp);
      this._updateUi();
      return true;
    }

    console.log('[Esp32Api] 未检测到设备');
    return false;
  },

  /** 手动设置设备 IP 地址 */
  setDeviceIp(ip) {
    this._deviceIp = ip;
    this._available = true;
    localStorage.setItem('echocare_device_ip', ip);
    this._updateUi();
  },

  /** 断开设备连接 */
  disconnect() {
    this._deviceIp = null;
    this._available = false;
    localStorage.removeItem('echocare_device_ip');
    this._updateUi();
  },

  /** 更新侧边栏中的设备状态 UI */
  _updateUi() {
    const el = document.getElementById('deviceStatus');
    const nameEl = document.getElementById('deviceName');
    const ipEl = document.getElementById('deviceIp');
    if (this._available && this._deviceIp) {
      if (el) el.style.display = 'block';
      if (nameEl) nameEl.textContent = '设备已连接';
      if (ipEl) ipEl.textContent = this._deviceIp;
    } else {
      if (el) el.style.display = 'none';
    }
  },

  /** 是否已连接到设备 */
  isConnected() {
    return this._available && !!this._deviceIp;
  },

  /** 获取设备基础 URL */
  _baseUrl() {
    return 'http://' + this._deviceIp;
  },

  /**
   * 从设备读取配置
   * @returns {Promise<Object|null>} 配置对象，连接失败返回 null
   */
  async getConfig() {
    if (!this._available) return null;
    try {
      const resp = await fetch(this._baseUrl() + '/api/config', { method: 'GET' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const config = await resp.json();
      console.log('[Esp32Api] 已从设备读取配置:', config);
      return config;
    } catch (e) {
      console.warn('[Esp32Api] 读取配置失败:', e.message);
      this._available = false;
      return null;
    }
  },

  /**
   * 将配置写入设备（存入 ESP32 的 NVS Flash）
   * @param {Object} agentData - 智能体配置
   * @returns {Promise<boolean>}
   */
  async saveConfig(agentData) {
    if (!this._available) return false;
    try {
      const payload = {
        name: agentData.name || 'Echo',
        gender: agentData.gender || 'female',
        language: agentData.language || 'mandarin',
        voice: agentData.voice || '',
        model: agentData.model || 'qwen-turbo',
        branch: agentData.branch || 'default',
        presets: agentData.presets || [],
        prompt: agentData.prompt || ''
      };
      const resp = await fetch(this._baseUrl() + '/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await resp.json();
      if (result.ok) {
        console.log('[Esp32Api] 配置已写入设备');
        return true;
      }
      console.warn('[Esp32Api] 写入失败:', result);
      return false;
    } catch (e) {
      console.warn('[Esp32Api] 写入配置失败:', e.message);
      this._available = false;
      return false;
    }
  },

  /** 获取设备状态 */
  async getStatus() {
    if (!this._available) return null;
    try {
      const resp = await fetch(this._baseUrl() + '/api/status');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return await resp.json();
    } catch (e) {
      return null;
    }
  }
};

// 页面加载时自动检测
Esp32Api.detect();
