import React, { useState } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Typography, Divider, Alert } from "antd";
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const keyTypeOptions = [
    { label: "EC256 (P-256)", value: "P256" },
    { label: "EC384 (P-384)", value: "P384" },
    { label: "RSA2048", value: "2048" },
    { label: "RSA3072", value: "3072" },
    { label: "RSA4096", value: "4096" },
    { label: "RSA8192", value: "8192" },
];

export const ACMECreate = () => {
    const { formProps, saveButtonProps } = useForm();
    const { t } = useTranslation();
    // 受控 value
    const [serverValue, setServerValue] = useState("https://acme-v02.api.letsencrypt.org/directory");
    const [searchInput, setSearchInput] = useState("");

    // 服务器选项
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

    // 判断是否为预设选项
    const isPreset = (value: string) => serverOptions.some(opt => opt.value === value);

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
    const handleServerChange = (value: string) => {
        setServerValue(value);
        formProps.form?.setFieldsValue({ server: value });
    };

    // 输入时
    const handleServerSearch = (input: string) => {
        setSearchInput(input);
        // 让输入内容成为 value
        setServerValue(input);
        formProps.form?.setFieldsValue({ server: input });
    };

    // 初始化表单时同步 value
    React.useEffect(() => {
        formProps.form?.setFieldsValue({ server: serverValue });
    }, [formProps.form, serverValue]);

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                layout="vertical"
                initialValues={{
                    key_type: "P256",
                    server: "https://acme-v02.api.letsencrypt.org/directory"
                }}
            >
                <Form.Item
                    label={t('acmeAccountPage.name')}
                    name={["name"]}
                    rules={[{ required: true, message: t('acmeAccountPage.enterName') }]}
                >
                    <Input placeholder={t('acmeAccountPage.enterName')} />
                </Form.Item>

                <Form.Item
                    label={t('acmeAccountPage.keyType')}
                    name={["key_type"]}
                    rules={[{ required: true, message: t('common.pleaseSelect', { field: t('acmeAccountPage.keyType') }) }]}
                >
                    <Select
                        placeholder={t('common.pleaseSelect', { field: t('acmeAccountPage.keyType') })}
                        options={keyTypeOptions}
                    />
                </Form.Item>

                <Form.Item
                    label={t('acmeAccountPage.server')}
                    name={["server"]}
                    rules={[
                        { required: true, message: t('common.pleaseSelectOrEnter', { field: t('acmeAccountPage.server') }) },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.reject(t('common.pleaseSelectOrEnter', { field: t('acmeAccountPage.server') }));
                                try {
                                    new URL(value);
                                    return Promise.resolve();
                                } catch {
                                    return Promise.reject(t('common.pleaseEnterValidUrl'));
                                }
                            }
                        }
                    ]}
                    extra={
                        <Text type="secondary">
                            {t('acmeAccountPage.serverHelp')}
                        </Text>
                    }
                >
                    <Select
                        showSearch
                        allowClear={false}
                        placeholder={t('common.pleaseSelectOrEnter', { field: t('acmeAccountPage.server') })}
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                            (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase()) ||
                            (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        notFoundContent={<Text type="secondary">{t('acmeAccountPage.enterCustomServer')}</Text>}
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
                                    {t('acmeAccountPage.customServerSelected')}<Text code>{serverValue}</Text>
                                </span>
                            }
                        />
                    )
                }

                <Form.Item
                    label={t('acmeAccountPage.email')}
                    name={["email"]}
                    rules={[
                        { required: true, message: t('common.pleaseEnter', { field: t('acmeAccountPage.email') }) },
                        { type: 'email', message: t('common.pleaseEnterValidEmail') }
                    ]}
                >
                    <Input placeholder={t('common.pleaseEnter', { field: t('acmeAccountPage.email') })} />
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
                        {t('common.optional')}
                    </Text>
                    <div style={{ marginTop: 16 }}>
                        <Form.Item
                            label="EAB KID"
                            name={["eab_kid"]}
                            rules={[{ required: false }]}
                            style={{ marginBottom: 12 }}
                        >
                            <Input placeholder={t('common.pleaseEnter', { field: 'EAB KID' })} />
                        </Form.Item>
                        <Form.Item
                            label="EAB HMAC KEY"
                            name={["eab_hmac_key"]}
                            rules={[{ required: false }]}
                            style={{ marginBottom: 0 }}
                        >
                            <Input placeholder={t('common.pleaseEnter', { field: 'EAB HMAC KEY' })} />
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </Create>
    );
};