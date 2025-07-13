import React from "react";
import { useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Button, Space, message } from "antd";

interface UserCreateProps {
    onSuccess?: () => void;
}

export const UserCreate: React.FC<UserCreateProps> = ({ onSuccess }) => {
    const { formProps, saveButtonProps, form } = useForm({
        onMutationSuccess: () => {
            message.success("用户创建成功");
            form.resetFields();
            onSuccess?.();
        },
        onMutationError: (error) => {
            message.error("用户创建失败");
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
                    label={<span style={{ fontWeight: 500 }}>用户名</span>}
                    name="username"
                    rules={[
                        {
                            required: true,
                            message: "请输入用户名",
                        },
                        {
                            min: 3,
                            message: "用户名至少3个字符",
                        },
                    ]}
                    style={{ marginBottom: '20px' }}
                >
                    <Input 
                        placeholder="请输入用户名" 
                        style={{
                            borderRadius: '6px',
                            border: '1px solid #e8e8e8',
                            padding: '8px 12px',
                            fontSize: '14px',
                        }}
                    />
                </Form.Item>
                
                <Form.Item
                    label={<span style={{ fontWeight: 500 }}>密码</span>}
                    name="password"
                    rules={[
                        {
                            required: true,
                            message: "请输入密码",
                        },
                        {
                            min: 6,
                            message: "密码至少6个字符",
                        },
                    ]}
                    style={{ marginBottom: '20px' }}
                >
                    <Input.Password 
                        placeholder="请输入密码" 
                        style={{
                            borderRadius: '6px',
                            border: '1px solid #e8e8e8',
                            padding: '8px 12px',
                            fontSize: '14px',
                        }}
                    />
                </Form.Item>

                <Form.Item
                    label={<span style={{ fontWeight: 500 }}>角色</span>}
                    name="role_ids"
                    style={{ marginBottom: '32px' }}
                >
                    <Select
                        {...roleSelectProps}
                        mode="multiple"
                        placeholder="请选择角色"
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
                            取消
                        </Button>
                        <Button 
                            {...saveButtonProps}
                            type="primary"
                            style={{
                                borderRadius: '6px',
                                fontWeight: 500,
                            }}
                        >
                            创建用户
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
};
