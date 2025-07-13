import React, { useState } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Typography, Divider, Alert } from "antd";

const { Text } = Typography;

const keyTypeOptions = [
    { label: "EC256 (P-256)", value: "P256" },
    { label: "EC384 (P-384)", value: "P384" },
    { label: "RSA2048", value: "2048" },
    { label: "RSA3072", value: "3072" },
    { label: "RSA4096", value: "4096" },
    { label: "RSA8192", value: "8192" },
];

const serverOptions = [
    {
        label: (
            <span>
                Let's Encrypt{" "}
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    https://acme-v02.api.letsencrypt.org/directory
                </Text>
            </span>
        ),
        value: "https://acme-v02.api.letsencrypt.org/directory",
    },
    {
        label: (
            <span>
                Let's Encrypt Staging{" "}
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                    https://acme-staging-v02.api.letsencrypt.org/directory
                </Text>
            </span>
        ),
        value: "https://acme-staging-v02.api.letsencrypt.org/directory",
    },
];

export const ACMECreate = () => {
    const { formProps, saveButtonProps } = useForm();
    // 受控 value
    const [serverValue, setServerValue] = useState(serverOptions[0].value);
    const [searchInput, setSearchInput] = useState("");

    // 判断是否为预设选项
    const isPreset = (value) => serverOptions.some(opt => opt.value === value);

    // 生成下拉选项
    const getOptions = () => {
        if (searchInput && !isPreset(searchInput)) {
            return [
                ...serverOptions,
                {
                    label: (
                        <span>

                            <Text code>{searchInput}</Text>
                        </span>
                    ),
                    value: searchInput,
                }
            ];
        }
        return serverOptions;
    };

    // 选中/输入时同步到表单
    const handleServerChange = (value) => {
        setServerValue(value);
        formProps.form.setFieldsValue({ server: value });
    };

    // 输入时
    const handleServerSearch = (input) => {
        setSearchInput(input);
        // 让输入内容成为 value
        setServerValue(input);
        formProps.form.setFieldsValue({ server: input });
    };

    // 初始化表单时同步 value
    React.useEffect(() => {
        formProps.form.setFieldsValue({ server: serverValue });
    }, [formProps.form, serverValue]);

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                layout="vertical"
                initialValues={{
                    key_type: "P256",
                    server: serverOptions[0].value
                }}
            >
                <Form.Item
                    label="Name"
                    name={["name"]}
                    rules={[{ required: true, message: "请输入名称" }]}
                >
                    <Input placeholder="请输入名称" />
                </Form.Item>

                <Form.Item
                    label="Key Type"
                    name={["key_type"]}
                    rules={[{ required: true, message: "请选择密钥类型" }]}
                >
                    <Select
                        placeholder="请选择密钥类型"
                        options={keyTypeOptions}
                    />
                </Form.Item>

                <Form.Item
                    label="Server"
                    name={["server"]}
                    rules={[
                        { required: true, message: "请选择或输入服务器地址" },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.reject("请选择或输入服务器地址");
                                try {
                                    new URL(value);
                                    return Promise.resolve();
                                } catch {
                                    return Promise.reject("请输入有效的 URL 地址");
                                }
                            }
                        }
                    ]}
                    extra={
                        <Text type="secondary">
                            你可以选择上方预设服务器，或直接输入自定义 ACME 服务器地址
                        </Text>
                    }
                >
                    <Select
                        showSearch
                        allowClear={false}
                        placeholder="请选择或输入 ACME 服务器地址"
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            (option?.children?.toString() ?? '').toLowerCase().includes(input.toLowerCase()) ||
                            (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        notFoundContent={<Text type="secondary">输入自定义 ACME 服务器地址</Text>}
                        options={getOptions()}
                        value={serverValue}
                        onChange={handleServerChange}
                        onSearch={handleServerSearch}
                        onBlur={() => setSearchInput("")}
                    />
                </Form.Item>
                {
                    serverValue && !isPreset(serverValue) && (
                        <Alert
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                            message={
                                <span>
                                    当前已选择自定义 ACME 服务器地址：<Text code>{serverValue}</Text>
                                </span>
                            }
                        />
                    )
                }

                <Form.Item
                    label="Email"
                    name={["email"]}
                    rules={[
                        { required: true, message: "请输入邮箱" },
                        { type: 'email', message: "请输入有效的邮箱地址" }
                    ]}
                >
                    <Input placeholder="请输入邮箱地址" />
                </Form.Item>

                {/* EAB参数区块 */}
                <Divider style={{ margin: "24px 0 12px 0" }} />
                <div
                    style={{
                        background: "#fafafa",
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 0,
                        position: "relative",
                    }}
                >
                    <Text strong style={{ fontSize: 16 }}>External Account Binding</Text>
                    <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
                        可选配置项
                    </Text>
                    <div style={{ marginTop: 16 }}>
                        <Form.Item
                            label="EAB KID"
                            name={["eab_kid"]}
                            rules={[{ required: false }]}
                            style={{ marginBottom: 12 }}
                        >
                            <Input placeholder="请输入 EAB KID" />
                        </Form.Item>
                        <Form.Item
                            label="EAB HMAC KEY"
                            name={["eab_hmac_key"]}
                            rules={[{ required: false }]}
                            style={{ marginBottom: 0 }}
                        >
                            <Input placeholder="请输入 EAB HMAC KEY" />
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </Create>
    );
};