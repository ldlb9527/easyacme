import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/antd";
import { useGetIdentity, useLogout } from "@refinedev/core";
import {
  Layout as AntdLayout,
  Avatar,
  Space,
  Switch,
  theme,
  Typography,
  Badge,
  Dropdown,
  Menu,
  Button,
} from "antd";
import React, { useContext } from "react";
import { LogoutOutlined, UserOutlined, SettingOutlined, GlobalOutlined } from "@ant-design/icons";
import { changeLanguage } from "../../utils/language";
import { ColorModeContext } from "../../contexts/color-mode";
import { useTranslation } from "react-i18next";

const { Text } = Typography;
const { useToken } = theme;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky = true,
}) => {
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const { t, i18n } = useTranslation();
  const { mutate: logout } = useLogout();

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
    borderBottom: `1px solid ${token.colorBorder}`,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  // 切换语言
  const toggleLanguage = async () => {
    const newLang = i18n.language === "zh-CN" ? "en-US" : "zh-CN";
    await changeLanguage(newLang);
  };

  return (
    <AntdLayout.Header style={headerStyles}>
      {/* 左侧品牌区域 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Text 
          strong 
          style={{ 
            fontSize: '16px', 
            color: token.colorPrimary,
            fontWeight: 600
          }}
        >
          Easy ACME
        </Text>
        <Badge 
          status="success" 
          text={
            <Text style={{ fontSize: '12px', color: token.colorTextSecondary }}>

            </Text>
          } 
        />
      </div>

      {/* 右侧用户区域 */}
      <Space size={16}>
        {/* 语言切换按钮 */}
        <Button
          icon={<GlobalOutlined />}
          type="text"
          onClick={toggleLanguage}
          style={{
            color: token.colorTextSecondary,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {i18n.language === "zh-CN" ? "EN" : "中"}
        </Button>

        {/* 主题切换按钮 */}
        <Switch
          checkedChildren="🌙"
          unCheckedChildren="☀️"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
          style={{
            backgroundColor: mode === 'dark' ? '#6366f1' : '#f1f5f9',
          }}
        />
        
        <Dropdown 
          overlay={
            <Menu 
              items={[
                {
                  key: 'profile',
                  icon: <UserOutlined />,
                  label: t("user.profile"),
                },
                {
                  key: 'settings',
                  icon: <SettingOutlined />,
                  label: t("user.settings"),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: t("user.logout"),
                  onClick: () => logout(),
                  danger: true,
                },
              ]}
              style={{
                borderRadius: '8px',
                boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
              }}
            />
          }
          placement="bottomRight"
          trigger={['click']}
        >
          <Space style={{ marginLeft: "8px", cursor: 'pointer' }} size="middle">
            {user?.name && (
              <Text 
                strong 
                style={{ 
                  fontSize: '14px',
                  color: token.colorText
                }}
              >
                {user.name}
              </Text>
            )}
            <Space>
              <Avatar 
                src={user?.avatar} 
                style={{ 
                  backgroundColor: user?.avatar ? 'transparent' : token.colorPrimary,
                  border: `2px solid ${token.colorBorder}`,
                  cursor: 'pointer',
                }}
              >
                {!user?.avatar && (user?.name?.charAt(0) || 'U')}
              </Avatar>
              <span style={{ fontSize: '12px', color: token.colorTextSecondary }}>▼</span>
            </Space>
          </Space>
        </Dropdown>
      </Space>
    </AntdLayout.Header>
  );
};
