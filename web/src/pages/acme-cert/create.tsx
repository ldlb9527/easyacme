import React, { useState } from "react";
import { Modal, Steps, Form, Input, Button, message, Select, Table, Radio, Card, Typography } from "antd";
import dayjs from "dayjs";
import { useList, useCreate, useCustomMutation } from "@refinedev/core";
import { API_BASE_URL } from "../../config";
import { useTranslation } from 'react-i18next';

const { Step } = Steps;
const { Text, Paragraph } = Typography;

const keyTypeOptions = [
    { label: "EC256 (P-256)", value: "P256" },
    { label: "RSA2048", value: "2048" },
    { label: "RSA4096", value: "4096" },
];

interface CertApplyModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const CertApplyModal: React.FC<CertApplyModalProps> = ({ visible, onClose, onSuccess }) => {
    const [current, setCurrent] = useState(0);
    const [form1] = Form.useForm();
    const [form2] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [verifyMode, setVerifyMode] = useState<'manual' | 'auto'>('manual');
    const [authData, setAuthData] = useState<any>(null);
    const [dnsProviderSelected, setDnsProviderSelected] = useState<string>('');
    const { t } = useTranslation();

    // 获取 ACME 账户列表
    const { data: acmeAccounts } = useList({
        resource: "acme/accounts",
    });

    // 获取 DNS 提供商列表
    const { data: dnsProviders } = useList({
        resource: "dns/provider",
    });

    // 创建授权的 mutation
    const { mutate: createAuth } = useCreate();

    // 用于收集所有步骤的数据
    const [formData, setFormData] = useState<any>({});

    // 调用 CreateAuth 接口
    const handleCreateAuth = async (values: any) => {
        setLoading(true);
        try {
            const domains = values.domains.split('\n').filter((domain: string) => domain.trim());
            const authReq = {
                account_id: values.acme_account_id,
                domains: domains,
                key_type: values.key_type,
            };

            await createAuth({
                resource: "acme/auth",
                values: authReq,
            }, {
                onSuccess: (data) => {
                    setAuthData(data.data);
                    setFormData({ ...formData, ...values, domains });
                    setCurrent(1);
                    setLoading(false);
                },
                onError: (error) => {
                    message.error("创建授权失败: " + error.message);
                    setLoading(false);
                }
            });
        } catch (error: any) {
            message.error("创建授权失败: " + error.message);
            setLoading(false);
        }
    };

    // 验证证书 - 修改为直接调用GenCert接口
    const handleVerify = async () => {
        setLoading(true);
        try {
            const domains = formData.domains;
            
            // 构建请求参数
            const requestData: any = {
                key_type: formData.key_type,
                account_id: formData.acme_account_id,
                domains: domains
            };

            // 如果是自动验证模式，添加DNS提供商ID
            if (verifyMode === 'auto') {
                const dnsProviderId = form2.getFieldValue('dns_provider_id') || dnsProviderSelected;
                if (!dnsProviderId) {
                    message.error('请选择DNS提供商');
                    setLoading(false);
                    return;
                }
                requestData.dns_provider_id = dnsProviderId;
            }
            // 手动验证模式不传dns_provider_id字段，后端通过字段是否存在判断模式

            // 统一使用同一个API路径
            const response = await fetch(`${API_BASE_URL}/acme/auth/cert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                message.success(t('acmeCertPage.applySuccess'));
                setLoading(false);
                onSuccess && onSuccess();
                onClose();
            } else {
                const errorData = await response.json();
                message.error(t('acmeCertPage.applyFailed') + ": " + (errorData.error || t('acmeCertPage.unknownError')));
                setLoading(false);
            }
        } catch (error: any) {
            message.error(t('acmeCertPage.applyFailed') + ": " + error.message);
            setLoading(false);
        }
    };

    // DNS记录表格列定义
    const dnsRecordColumns = [
        {
            title: t('acmeCertPage.hostRecord'),
            dataIndex: 'host',
            key: 'host',
            render: (_: any, record: any, index: number) => {
                const fqdn = authData?.info_list?.[index]?.EffectiveFQDN || '';
                return fqdn;
            }
        },
        {
            title: t('acmeCertPage.recordValue'),
            dataIndex: 'value',
            key: 'value',
            render: (_: any, record: any, index: number) => {
                const value = authData?.info_list?.[index]?.Value || '';
                return (
                    <span style={{ wordBreak: 'break-all' }}>
                        {value}
                    </span>
                );
            }
        }
    ];

    // 检查按钮是否应该禁用
    const isButtonDisabled = () => {
        if (loading) return true;
        if (verifyMode === 'manual') return false;
        // 自动验证模式需要选择DNS提供商
        return !dnsProviderSelected;
    };

    // 步骤内容
    const steps = [
        {
            title: t('acmeCertPage.basicInfo'),
            content: (
                <Form
                    form={form1}
                    layout="vertical"
                    initialValues={{ key_type: "P256" }}
                    onFinish={handleCreateAuth}
                >
                    <Form.Item 
                        label={t('acmeCertPage.acmeAccount')}
                        name="acme_account_id" 
                        rules={[{ required: true, message: t('acmeCertPage.pleaseSelectAcmeAccount') }]}
                    >
                        <Select
                            placeholder={t('acmeCertPage.pleaseSelectAcmeAccount')}
                            options={acmeAccounts?.data?.map((account: any) => ({
                                label: account.name,
                                value: account.id,
                            }))}
                        />
                    </Form.Item>

                    <Form.Item 
                        label={t('acmeCertPage.certKeyType')}
                        name="key_type" 
                        rules={[{ required: true, message: t('acmeCertPage.pleaseSelectKeyType') }]}
                    >
                        <Select
                            placeholder={t('acmeCertPage.pleaseSelectKeyType')}
                            options={keyTypeOptions}
                        />
                    </Form.Item>

                    <Form.Item 
                        label={t('acmeCertPage.domainList')}
                        name="domains" 
                        rules={[{ required: true, message: t('acmeCertPage.pleaseEnterDomainList') }]}
                        extra={t('acmeCertPage.oneLinePerDomain')}
                    >
                        <Input.TextArea 
                            rows={4} 
                            placeholder="example.com&#10;www.example.com"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {t('acmeCertPage.nextStep')}
                        </Button>
                    </Form.Item>
                </Form>
            ),
        },
        {
            title: t('acmeCertPage.domainVerification'),
            content: (
                <div>
                    {/* 验证模式选择 */}
                    <Card style={{ marginBottom: 16 }}>
                        <Form.Item label={t('acmeCertPage.verificationMode')}>
                            <Radio.Group 
                                value={verifyMode} 
                                onChange={(e) => {
                                    setVerifyMode(e.target.value);
                                    // 切换模式时重置DNS提供商选择状态
                                    if (e.target.value === 'manual') {
                                        setDnsProviderSelected('');
                                        form2.resetFields();
                                    }
                                }}
                            >
                                <Radio value="manual">{t('acmeCertPage.manualVerification')}</Radio>
                                <Radio value="auto">{t('acmeCertPage.automaticVerification')}</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Card>

                    {/* 手动验证模式 */}
                    {verifyMode === 'manual' && (
                        <Card title={t('acmeCertPage.dnsRecordConfig')} style={{ marginBottom: 16 }}>
                            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                                {t('acmeCertPage.addDnsTxtRecords')}
                            </Paragraph>
                            <Table
                                columns={dnsRecordColumns}
                                dataSource={formData.domains?.map((_: any, index: number) => ({ key: index }))}
                                pagination={false}
                                size="small"
                            />
                        </Card>
                    )}

                    {/* 自动验证模式 */}
                    {verifyMode === 'auto' && (
                        <Card title={t('acmeCertPage.dnsAutoVerification')} style={{ marginBottom: 16 }}>
                            <Form form={form2} layout="vertical">
                                <Form.Item 
                                    label={t('acmeCertPage.selectDnsProvider')}
                                    name="dns_provider_id"
                                    rules={[{ required: true, message: t('acmeCertPage.pleaseSelectDnsProvider') }]}
                                >
                                    <Select
                                        placeholder={t('acmeCertPage.pleaseSelectDnsProvider')}
                                        value={dnsProviderSelected}
                                        onChange={(value) => {
                                            setDnsProviderSelected(value);
                                            form2.setFieldsValue({ dns_provider_id: value });
                                        }}
                                        options={dnsProviders?.data?.map((provider: any) => ({
                                            label: `${provider.name} (${provider.type})`,
                                            value: provider.id,
                                        }))}
                                    />
                                </Form.Item>
                                <Paragraph>
                                    {t('acmeCertPage.autoVerificationDescription')}
                                </Paragraph>
                            </Form>
                        </Card>
                    )}

                    {/* 操作按钮 */}
                    <div style={{ textAlign: 'center' }}>
                        <Button onClick={() => setCurrent(0)} style={{ marginRight: 8 }}>
                            {t('acmeCertPage.prevStep')}
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={handleVerify}
                            loading={loading}
                            disabled={isButtonDisabled()}
                        >
                            {verifyMode === 'manual' ? t('acmeCertPage.verifyAndApply') : t('acmeCertPage.autoApply')}
                        </Button>
                    </div>
                </div>
            ),
        },
    ];

    const handleModalClose = () => {
        // 重置所有状态
        setCurrent(0);
        setVerifyMode('manual');
        setAuthData(null);
        setFormData({});
        setDnsProviderSelected('');
        form1.resetFields();
        form2.resetFields();
        onClose();
    };

    return (
        <Modal
            open={visible}
            onCancel={handleModalClose}
            footer={null}
            title={t('acmeCertPage.applyCertificate')}
            width={800}
            destroyOnClose
            maskClosable={false}
        >
            <Steps current={current} style={{ marginBottom: 24 }}>
                {steps.map(item => <Step key={item.title} title={item.title} />)}
            </Steps>
            <div>{steps[current].content}</div>
        </Modal>
    );
};

interface CertApplyProps {
    onSuccess?: () => void;
}

export const CertApply: React.FC<CertApplyProps> = ({ onSuccess }) => {
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();

    return (
        <>
            <Button type="primary" onClick={() => setVisible(true)}>
                {t('acmeCertPage.applyCertificate')}
            </Button>
            <CertApplyModal
                visible={visible}
                onClose={() => setVisible(false)}
                onSuccess={onSuccess}
            />
        </>
    );
};