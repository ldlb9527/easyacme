import React from "react";
import { useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Button, Space, message } from "antd";
import { useTranslation } from 'react-i18next';

interface UserCreateProps {
    onSuccess?: () => void;
}

export const UserCreate: React.FC<UserCreateProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const { formProps, saveButtonProps, form } = useForm({
        onMutationSuccess: () => {
            message.success(t('userPage.createSuccess'));
            form.resetFields();
            onSuccess?.();
        },
        onMutationError: (error) => {
            message.error(t('userPage.createFailed'));
        },
    });

    // 获取角色列表数据
    const { selectProps: roleSelectProps } = useSelect({
        resource: "account/roles",
        pagination: {
            pageSize: 10000, // 获取所有角色
        },
        optionLabel: "name",
        optionValue: "id",
    });

    return (
        <div style={{ padding: '0' }}>
            <Form 
                {...formProps} 
                layout="vertical"
                style={{ maxWidth: '100%' }}
                requiredMark={false}
            >
                <Form.Item
                    label={<span style={{ fontWeight: 500 }}>{t('userPage.username')}</span>}
                    name="username"
                    rules={[
                        {
                            required: true,
                            message: t('userPage.usernameRequired'),
                        },
                        {
                            min: 3,
                            message: t('userPage.usernameMinLength'),
                        },
                    ]}
                    style={{ marginBottom: '20px' }}
                >
                    <Input 
                        placeholder={t('userPage.enterUsername')} 
                        style={{
                            borderRadius: '6px',
                            border: '1px solid #e8e8e8',
                            padding: '8px 12px',
                            fontSize: '14px',
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label={<span style={{ fontWeight: 500 }}>{t('userPage.password')}</span>}
                    name="password"
                    rules={[
                        {
                            required: true,
                            message: t('userPage.passwordRequired'),
                        },
                        {
                            min: 6,
                            message: t('userPage.passwordMinLength'),
                        },
                    ]}
                    style={{ marginBottom: '20px' }}
                >
                    <Input.Password 
                        placeholder={t('userPage.enterPassword')} 
                        style={{
                            borderRadius: '6px',
                            border: '1px solid #e8e8e8',
                            padding: '8px 12px',
                            fontSize: '14px',
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label={<span style={{ fontWeight: 500 }}>{t('userPage.role')}</span>}
                    name="role_ids"
                    style={{ marginBottom: '32px' }}
                >
                    <Select
                        {...roleSelectProps}
                        mode="multiple"
                        placeholder={t('userPage.selectRoles')}
                        allowClear
                        showSearch
                        style={{
                            borderRadius: '6px',
                        }}
                        filterOption={(input, option) =>
                            String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Space>
                        <Button 
                            onClick={() => onSuccess?.()}
                            style={{
                                borderRadius: '6px',
                                border: '1px solid #e8e8e8',
                                color: '#666',
                            }}
                        >
                            {t('userPage.cancel')}
                        </Button>
                        <Button 
                            {...saveButtonProps}
                            type="primary"
                            style={{
                                borderRadius: '6px',
                                fontWeight: 500,
                            }}
                        >
                            {t('userPage.createUser')}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
};
