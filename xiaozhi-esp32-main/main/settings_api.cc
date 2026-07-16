#include "settings_api.h"
#include "settings.h"
#include "application.h"

#include <esp_log.h>
#include <esp_http_server.h>
#include <esp_netif.h>
#include <cJSON.h>
#include <cstring>
#include <string>
#include <vector>

#define TAG "SettingsApi"

// ============================================================================
// 读取整个智能体配置，序列化为 JSON 字符串
// ============================================================================
static std::string ReadAgentConfigToJson() {
    Settings settings("agent", false);
    cJSON* root = cJSON_CreateObject();

    // 基础配置
    cJSON_AddStringToObject(root, "name",
        settings.GetString("name", "Echo").c_str());
    cJSON_AddStringToObject(root, "gender",
        settings.GetString("gender", "female").c_str());
    cJSON_AddStringToObject(root, "language",
        settings.GetString("language", "mandarin").c_str());
    cJSON_AddStringToObject(root, "voice",
        settings.GetString("voice", "xiaoxiao").c_str());
    cJSON_AddStringToObject(root, "model",
        settings.GetString("model", "qwen-turbo").c_str());
    cJSON_AddStringToObject(root, "branch",
        settings.GetString("branch", "default").c_str());

    // 人格预设数组
    cJSON* presets = cJSON_CreateArray();
    for (int i = 0; i < 10; i++) {
        char key[32];
        snprintf(key, sizeof(key), "preset_%d", i);
        std::string val = settings.GetString(key, "");
        if (!val.empty()) {
            cJSON_AddItemToArray(presets, cJSON_CreateString(val.c_str()));
        }
    }
    cJSON_AddItemToObject(root, "presets", presets);

    // 自定义提示词
    cJSON_AddStringToObject(root, "prompt",
        settings.GetString("prompt", "").c_str());

    char* json_str = cJSON_PrintUnformatted(root);
    std::string result(json_str);
    cJSON_free(json_str);
    cJSON_Delete(root);
    return result;
}

// ============================================================================
// 解析 JSON 并写入 NVS Flash
// ============================================================================
static bool SaveAgentConfigFromJson(const std::string& json_body) {
    cJSON* root = cJSON_Parse(json_body.c_str());
    if (!root) {
        ESP_LOGE(TAG, "JSON parse failed: %s",
            cJSON_GetErrorPtr() ? cJSON_GetErrorPtr() : "unknown");
        return false;
    }

    Settings settings("agent", true);

    auto set_str = [&](const char* key, cJSON* obj, const char* json_key) {
        cJSON* item = cJSON_GetObjectItem(obj, json_key);
        if (item && cJSON_IsString(item)) {
            settings.SetString(key, item->valuestring);
        }
    };

    set_str("name", root, "name");
    set_str("gender", root, "gender");
    set_str("language", root, "language");
    set_str("voice", root, "voice");
    set_str("model", root, "model");
    set_str("branch", root, "branch");
    set_str("prompt", root, "prompt");

    // 处理 presets 数组
    cJSON* presets = cJSON_GetObjectItem(root, "presets");
    if (presets && cJSON_IsArray(presets)) {
        // 先清除旧数据
        for (int i = 0; i < 10; i++) {
            char key[32];
            snprintf(key, sizeof(key), "preset_%d", i);
            settings.EraseKey(key);
        }
        // 写入新数据
        int idx = 0;
        cJSON* item = presets->child;
        while (item && idx < 10) {
            if (cJSON_IsString(item)) {
                char key[32];
                snprintf(key, sizeof(key), "preset_%d", idx);
                settings.SetString(key, item->valuestring);
                idx++;
            }
            item = item->next;
        }
    }

    cJSON_Delete(root);
    return true;
}

// ============================================================================
// 读取设备状态，序列化为 JSON
// ============================================================================
static std::string ReadStatusToJson() {
    Settings agent("agent", false);
    cJSON* root = cJSON_CreateObject();

    cJSON_AddStringToObject(root, "name",
        agent.GetString("name", "Echo").c_str());
    cJSON_AddStringToObject(root, "ip",
        SettingsApi::GetInstance().GetIpAddress().c_str());
    cJSON_AddStringToObject(root, "gender",
        agent.GetString("gender", "female").c_str());
    cJSON_AddStringToObject(root, "language",
        agent.GetString("language", "mandarin").c_str());
    cJSON_AddBoolToObject(root, "online", true);

    // 获取固件和设备信息
    auto& app = Application::GetInstance();
    cJSON_AddNumberToObject(root, "state", static_cast<int>(app.GetDeviceState()));

    char* json_str = cJSON_PrintUnformatted(root);
    std::string result(json_str);
    cJSON_free(json_str);
    cJSON_Delete(root);
    return result;
}

// ============================================================================
// HTTP 请求处理
// ============================================================================
static esp_err_t CorsHeadersHandler(httpd_req_t* req) {
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type");
    return ESP_OK;
}

static esp_err_t GetConfigHandler(httpd_req_t* req) {
    CorsHeadersHandler(req);
    httpd_resp_set_type(req, "application/json");
    std::string json = ReadAgentConfigToJson();
    httpd_resp_send(req, json.c_str(), json.size());
    return ESP_OK;
}

static esp_err_t PostConfigHandler(httpd_req_t* req) {
    CorsHeadersHandler(req);

    // 读取请求体
    char buf[4096] = {0};
    int ret = httpd_req_recv(req, buf, sizeof(buf) - 1);
    if (ret <= 0) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Empty body");
        return ESP_FAIL;
    }

    std::string body(buf, ret);
    ESP_LOGI(TAG, "POST /api/config body=%s", body.c_str());

    if (!SaveAgentConfigFromJson(body)) {
        httpd_resp_set_type(req, "application/json");
        httpd_resp_sendstr(req, "{\"ok\":false,\"error\":\"parse failed\"}");
        return ESP_FAIL;
    }

    // 通知配置变更
    SettingsApi::GetInstance().OnConfigChanged(nullptr);  // trigger callback

    httpd_resp_set_type(req, "application/json");
    httpd_resp_sendstr(req, "{\"ok\":true}");
    return ESP_OK;
}

static esp_err_t GetStatusHandler(httpd_req_t* req) {
    CorsHeadersHandler(req);
    httpd_resp_set_type(req, "application/json");
    std::string json = ReadStatusToJson();
    httpd_resp_send(req, json.c_str(), json.size());
    return ESP_OK;
}

static esp_err_t OptionsHandler(httpd_req_t* req) {
    CorsHeadersHandler(req);
    httpd_resp_sendstr(req, "");
    return ESP_OK;
}

// ============================================================================
// 网页控制台（静态页面）
// ============================================================================
static const char INDEX_HTML[] = R"rawliteral(
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>EchoCare 智能体</title>
<style>
body{font-family:sans-serif;margin:0;padding:16px;background:#f5f5f5}
.card{background:#fff;border-radius:8px;padding:16px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h2{margin:0 0 12px;font-size:18px}
label{display:block;font-size:13px;color:#666;margin:8px 0 4px}
input,select,textarea{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:14px;box-sizing:border-box}
textarea{height:80px;resize:vertical}
button{width:100%;padding:10px;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;margin-top:12px}
button:hover{background:#5558e6}
.status{font-size:12px;color:#888;text-align:center;margin-top:8px}
</style>
</head>
<body>
<h1>EchoCare</h1>
<p style="color:#888;font-size:13px">智能体配置面板</p>

<form id="configForm">
<div class="card">
<h2>基础信息</h2>
<label>名称</label><input name="name" value="Echo">
<label>性别</label><select name="gender"><option value="female">女</option><option value="male">男</option></select>
<label>语言</label><select name="language"></select>
<label>语音</label><select name="voice"></select>
<label>模型</label><select name="model"><option value="qwen-turbo">Qwen Turbo</option><option value="qwen-plus">Qwen Plus</option><option value="deepseek-v3">DeepSeek V3</option></select>
<label>分支</label><select name="branch"><option value="default">默认</option><option value="humorous">幽默</option><option value="gentle">温柔</option><option value="bold">大胆</option></select>
</div>

<div class="card">
<h2>自定义提示词</h2>
<textarea name="prompt" placeholder="例如：你是一个温柔体贴的情感陪伴机器人..."></textarea>
</div>

<button type="submit">保存到设备</button>
</form>
<p id="status" class="status"></p>

<script>
const BASE = '/api';

// 语言选项
const LANG_MAP = {'mandarin':'普通话','cantonese':'粤语','english':'英语','japanese':'日语','korean':'韩语','shanghainese':'上海话','sichuanese':'四川话','hokkien':'闽南语'};
const VOICE_MAP = {
  male:{mandarin:'yunyang',cantonese:'zh-HK-WanLung',english:'en-US-GuyNeural',japanese:'ja-JP-KeitaNeural',korean:'ko-KR-InJoonNeural'},
  female:{mandarin:'xiaoxiao',cantonese:'zh-HK-HiuGaaiNeural',english:'en-US-JennyNeural',japanese:'ja-JP-NanamiNeural',korean:'ko-KR-SunHiNeural'}
};

function populateOptions(){
  const g = document.querySelector('[name=gender]').value;
  const ls = document.querySelector('[name=language]');
  const vs = document.querySelector('[name=voice]');
  ls.innerHTML = ''; vs.innerHTML = '';
  for(const [k,v] of Object.entries(LANG_MAP)){
    ls.innerHTML += `<option value="${k}">${v}</option>`;
  }
  updateVoices(g, ls.value);
  ls.onchange = () => updateVoices(g, ls.value);
  document.querySelector('[name=gender]').onchange = () => updateVoices(
    document.querySelector('[name=gender]').value,
    document.querySelector('[name=language]').value
  );
}

function updateVoices(gender, lang){
  const vs = document.querySelector('[name=voice]');
  if(VOICE_MAP[gender] && VOICE_MAP[gender][lang]){
    vs.innerHTML = `<option value="${VOICE_MAP[gender][lang]}">${VOICE_MAP[gender][lang]}</option>`;
  } else {
    vs.innerHTML = '<option value="">--</option>';
  }
}
populateOptions();

// 加载当前配置
fetch(BASE + '/config')
  .then(r => r.json())
  .then(c => {
    for(const [k,v] of Object.entries(c)){
      if(k === 'presets' || k === 'prompt') continue;
      const el = document.querySelector(`[name=${k}]`);
      if(el) el.value = v;
    }
    document.querySelector('[name=prompt]').value = c.prompt || '';
    // 同步语音选项
    updateVoices(c.gender, c.language);
    setTimeout(() => {
      const ve = document.querySelector('[name=voice]');
      if(ve && c.voice) ve.value = c.voice;
    }, 100);
    document.getElementById('status').textContent = '已加载设备配置';
  })
  .catch(() => document.getElementById('status').textContent = '加载失败，请确认已连接设备');

// 保存
document.getElementById('configForm').addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const config = {};
  for(const [k,v] of fd.entries()) config[k] = v;
  config.presets = [];

  fetch(BASE + '/config', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(config)
  })
  .then(r => r.json())
  .then(j => {
    document.getElementById('status').textContent = j.ok ? '✅ 保存成功！重启设备或刷新页面生效' : '保存失败';
  })
  .catch(() => document.getElementById('status').textContent = '连接失败');
});
</script>
</body>
</html>
)rawliteral";

static esp_err_t RootHandler(httpd_req_t* req) {
    httpd_resp_set_type(req, "text/html");
    httpd_resp_send(req, INDEX_HTML, strlen(INDEX_HTML));
    return ESP_OK;
}

// ============================================================================
// public API
// ============================================================================
void SettingsApi::Start() {
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.server_port = 80;
    config.max_uri_handlers = 16;
    config.lru_purge_enable = true;

    httpd_handle_t server = nullptr;
    if (httpd_start(&server, &config) != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start HTTP server on port 80");
        return;
    }

    // 注册路由
    httpd_uri_t root_uri = {
        .uri = "/", .method = HTTP_GET, .handler = RootHandler, .user_ctx = nullptr
    };
    httpd_register_uri_handler(server, &root_uri);

    httpd_uri_t config_get_uri = {
        .uri = "/api/config", .method = HTTP_GET,
        .handler = GetConfigHandler, .user_ctx = nullptr
    };
    httpd_register_uri_handler(server, &config_get_uri);

    httpd_uri_t config_post_uri = {
        .uri = "/api/config", .method = HTTP_POST,
        .handler = PostConfigHandler, .user_ctx = nullptr
    };
    httpd_register_uri_handler(server, &config_post_uri);

    httpd_uri_t status_uri = {
        .uri = "/api/status", .method = HTTP_GET,
        .handler = GetStatusHandler, .user_ctx = nullptr
    };
    httpd_register_uri_handler(server, &status_uri);

    httpd_uri_t options_uri = {
        .uri = "/api/*", .method = HTTP_OPTIONS,
        .handler = OptionsHandler, .user_ctx = nullptr
    };
    httpd_register_uri_handler(server, &options_uri);

    // 获取 IP 地址
    esp_netif_t* netif = esp_netif_get_handle_from_ifkey("WIFI_STA_DEF");
    if (netif) {
        esp_netif_ip_info_t ip_info;
        if (esp_netif_get_ip_info(netif, &ip_info) == ESP_OK) {
            char ip[16];
            snprintf(ip, sizeof(ip), IPSTR, IP2STR(&ip_info.ip));
            ip_address_ = ip;
            ESP_LOGI(TAG, "Settings API started: http://%s", ip);
        }
    }

    ESP_LOGI(TAG, "Settings API ready");
}

std::string SettingsApi::GetIpAddress() const {
    return ip_address_;
}

void SettingsApi::OnConfigChanged(ConfigChangedCallback callback) {
    config_changed_callback_ = std::move(callback);
}
