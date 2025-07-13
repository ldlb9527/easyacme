import React from "react";
import { ThemedSiderV2 } from "@refinedev/antd";

export const CustomSider: React.FC<any> = (props) => {
  return (
    <div>
      <ThemedSiderV2
        {...props}
        fixed
        Title={() => (
          <div style={{ 
            padding: '0 16px', 
            fontSize: '18px',
            fontWeight: 600,
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            color: '#6366f1'
          }}>
            easyacme 管理
          </div>
        )}
      />
      {/* 简化的CSS样式隐藏logout菜单项 */}
      <style>{`
        /* 通过data属性和title隐藏logout菜单项 */
        .ant-menu-item[data-menu-id*="logout"],
        .ant-menu-item[title="退出登录"],
        .ant-menu-item[title="Logout"] {
          display: none !important;
        }
        
        /* 通过图标隐藏logout菜单项 */
        .ant-menu-item .anticon-logout {
          display: none !important;
        }
      `}</style>
    </div>
  );
}; 