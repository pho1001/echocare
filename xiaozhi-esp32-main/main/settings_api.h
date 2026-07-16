#ifndef SETTINGS_API_H
#define SETTINGS_API_H

#include <string>
#include <functional>

/**
 * HTTP 配置 API 服务
 * 
 * 在你的 ESP32 板上跑一个小型 HTTP 服务器，网页控制台通过它读写智能体配置。
 * 数据存在 NVS Flash 中，断电不丢，不经过任何外部服务器，完全免费。
 * 
 * API 接口:
 *   GET  /api/config   → 读取当前智能体配置 (JSON)
 *   POST /api/config   → 更新智能体配置 (JSON)
 *   GET  /api/status   → 设备状态 (名称/IP/在线状态)
 *   GET  /             → 返回控制台网页
 */

class SettingsApi {
public:
    static SettingsApi& GetInstance() {
        static SettingsApi instance;
        return instance;
    }

    SettingsApi(const SettingsApi&) = delete;
    SettingsApi& operator=(const SettingsApi&) = delete;

    /** 启动 HTTP 服务器（端口 80） */
    void Start();

    /** 获取设备 IP 地址字符串 */
    std::string GetIpAddress() const;

    /** 当配置变更时回调（数据已存入 NVS） */
    using ConfigChangedCallback = std::function<void()>;
    void OnConfigChanged(ConfigChangedCallback callback);

private:
    SettingsApi() = default;
    ~SettingsApi() = default;

    void HandleGetConfig(int fd);
    void HandlePostConfig(int fd, const std::string& body);
    void HandleGetStatus(int fd);
    void HandleGetRoot(int fd);

    ConfigChangedCallback config_changed_callback_;
    std::string ip_address_;
};

#endif // SETTINGS_API_H
