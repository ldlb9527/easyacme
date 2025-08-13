import React, { useState, useEffect } from "react";
import { useLogin } from "@refinedev/core";
import { Form, Input, Button, Typography, notification, Checkbox, theme } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { 
  UserOutlined, 
  LockOutlined, 
  SafetyCertificateOutlined
} from "@ant-design/icons";

const { Title } = Typography;

// const LogoIcon = () => (
//     <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
//         <circle cx="24" cy="24" r="24" fill="#1890ff" />
//         <text x="24" y="30" textAnchor="middle" fontSize="18" fill="#fff" fontFamily="Arial">🔒</text>
//     </svg>
// );

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const { mutate: login } = useLogin();
  const { token } = theme.useToken();
  const { t } = useTranslation();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      await login({
        username: values.username,
        password: values.password,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      notification.error({
        message: t('login.failed'),
        description: error?.message || t('login.invalidCredentials'),
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰元素 */}
      <div style={{
        position: 'absolute',
        right: '0',
        bottom: '0',
        width: '50%',
        height: '100%',
        backgroundImage: 'url()',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right bottom',
        opacity: 0.1,
        pointerEvents: 'none'
      }} />

      {/* 主登录容器 */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        padding: window.innerWidth <= 768 ? '30px 20px' : '50px',
        width: '100%',
        maxWidth: '500px',
        margin: '0 20px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo 和标题 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <SafetyCertificateOutlined style={{
            fontSize: '32px',
            color: token.colorPrimary
          }} />
        </div>

        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <Title level={1} style={{
            color: token.colorPrimary,
            margin: 0,
            fontWeight: 700,
            letterSpacing: '1.5px'
          }}>
            {t('login.title')}
          </Title>
        </div>

        {/* 登录表单 */}
        <Form
          onFinish={handleLogin}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            remember: false
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const form = e.currentTarget.closest('form');
              if (form) {
                const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                if (submitButton && !submitButton.disabled) {
                  submitButton.click();
                }
              }
            }
          }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('common.pleaseEnter', { field: t('login.username') }) }]}
            style={{ marginBottom: '20px' }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder={t('login.username')}
              style={{
                height: '48px',
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                fontSize: '16px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('common.pleaseEnter', { field: t('login.password') }) }]}
            style={{ marginBottom: '20px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder={t('login.password')}
              style={{
                height: '48px',
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                fontSize: '16px'
              }}
            />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked" style={{ marginBottom: '20px' }}>
            <Checkbox style={{ fontSize: '14px', color: '#8c8c8c' }}>
              {t('login.rememberMe')}
            </Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: '30px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500,
                boxShadow: 'none'
              }}
            >
              {t('login.loginButton')}
            </Button>
          </Form.Item>


        </Form>


      </div>
    </div>
  );
};
