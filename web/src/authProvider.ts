import type { AuthProvider } from "@refinedev/core";
import { API_BASE_URL } from './config';

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // 重要：包含cookies
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Session模式下，用户信息存储在session中，前端只需要存储基本信息
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        return {
          success: true,
          redirectTo: "/",
        };
      } else {
        return {
          success: false,
          error: {
            name: "LoginError",
            message: data.error || "登录失败",
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message: "网络错误，请稍后重试",
        },
      };
    }
  },

  logout: async () => {
    try {
      // 调用后端登出接口清除session
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // 重要：包含cookies
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      return {
        success: true,
        redirectTo: "/login",
      };
    }
  },

  check: async () => {
    try {
      // 通过session验证用户是否已登录
      const response = await fetch(`${API_BASE_URL}/auth/info`, {
        credentials: 'include', // 重要：包含cookies
      });

      if (response.ok) {
        const user = await response.json();
        localStorage.setItem("user", JSON.stringify(user));
        return {
          authenticated: true,
        };
      } else {
        // Session无效，清除本地存储
        localStorage.removeItem("user");
        return {
          authenticated: false,
          redirectTo: "/login",
        };
      }
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("user");
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },

  getPermissions: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      // 返回用户的角色权限
      return userData.roles?.map((role: any) => role.role?.name) || [];
    }
    return null;
  },

  getIdentity: async () => {
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      return {
        id: userData.id,
        name: userData.username,
        avatar: `https://ui-avatars.com/api/?name=${userData.username}&background=6366f1&color=fff`,
      };
    }
    return null;
  },

  onError: async (error) => {
    console.error("Auth error:", error);
    
    // 如果是401错误，说明session过期或无效
    if (error?.status === 401) {
      localStorage.removeItem("user");
      return {
        logout: true,
        redirectTo: "/login",
        error: {
          name: "AuthError",
          message: "会话已过期，请重新登录",
        },
      };
    }

    return { error };
  },
};
