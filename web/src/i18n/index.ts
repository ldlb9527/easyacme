import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 内联翻译资源
const resources = {
  en: {
    translation: {
      "common": {
        "language": "Language",
        "switchLanguage": "Switch Language"
      },
      "menu": {
        "dashboard": "Dashboard",
        "dnsProvider": "DNS Provider",
        "acmeAccounts": "ACME Accounts",
        "certificates": "Certificates",
        "system": "System",
        "users": "Users",
        "roles": "Roles"
      },
      "user": {
        "profile": "Profile",
        "settings": "Settings",
        "logout": "Logout"
      },
      "theme": {
        "light": "Light",
        "dark": "Dark"
      },
      "dashboard": {
        "loading": "Loading data...",
        "error": "Failed to load data",
        "errorDesc": "Unable to fetch statistics from server. Please try again later or contact administrator.",
        "accountStats": "Account Statistics",
        "total": "Total",
        "valid": "Valid",
        "deactivated": "Deactivated",
        "certManagement": "Certificate Management",
        "totalCerts": "Total",
        "issueTrend": "Issue Trend",
        "statusDistribution": "Status Distribution",
        "expired": "Expired",
        "revoked": "Revoked",
        "dnsProviderManagement": "DNS Provider Management",
        "domains": "domains",
        "providerDistribution": "Provider Distribution",
        "details": "Details",
        "provider": "Provider",
        "count": "Count",
        "percentage": "Percentage"
      }
    }
  },
  zh: {
    translation: {
      "common": {
        "language": "语言",
        "switchLanguage": "切换语言"
      },
      "menu": {
        "dashboard": "仪表盘",
        "dnsProvider": "DNS授权",
        "acmeAccounts": "ACME账户",
        "certificates": "证书列表",
        "system": "系统管理",
        "users": "用户管理",
        "roles": "角色管理"
      },
      "user": {
        "profile": "个人信息",
        "settings": "设置",
        "logout": "退出登录"
      },
      "theme": {
        "light": "亮色",
        "dark": "暗色"
      },
      "dashboard": {
        "loading": "数据加载中...",
        "error": "数据加载失败",
        "errorDesc": "无法从服务器获取统计数据，请稍后重试或联系管理员。",
        "accountStats": "账户统计",
        "total": "总数",
        "valid": "有效",
        "deactivated": "停用",
        "certManagement": "证书管理",
        "totalCerts": "总计",
        "issueTrend": "签发趋势",
        "statusDistribution": "状态分布",
        "expired": "过期",
        "revoked": "吊销",
        "dnsProviderManagement": "DNS服务商管理",
        "domains": "个域名",
        "providerDistribution": "服务商分布",
        "details": "详细信息",
        "provider": "服务商",
        "count": "数量",
        "percentage": "占比"
      }
    }
  }
};

// 配置i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'zh', // 默认语言为中文
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false // 不转义HTML
    }
  });

export default i18n; 