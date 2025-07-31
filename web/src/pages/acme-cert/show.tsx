import React, { useState } from "react";
import { useShow, useCan, useCustomMutation } from "@refinedev/core";
import {
    Show,
    TagField,
    TextField,
    DateField,
} from "@refinedev/antd";
import { Typography, Card, Col, Row, Button, message, Tooltip, Tag } from "antd";
import { API_BASE_URL } from "../../config";
import { CopyOutlined } from "@ant-design/icons";
import { useTranslation } from 'react-i18next';
import { getStatusMap } from "./status";

const { Title, Text } = Typography;

const CodeBlock = ({ code, maxHeight = "300px" }: { code?: string; maxHeight?: string }) => {
    const { t } = useTranslation();
    
    if (!code) {
        return <Text type="secondary">{t('acmeCertPage.noData')}</Text>;
    }
    
    const handleCopy = () => {
        if(code) {
            navigator.clipboard.writeText(code);
            message.success(t('acmeCertPage.copiedToClipboard'));
        }
    };

    return (
        <Card
            size="small"
            style={{ marginTop: 8, position: 'relative' }}
            bodyStyle={{
                padding: '12px',
                backgroundColor: "#fafafa",
                maxHeight: maxHeight,
                overflow: "auto",
            }}
        >
            <Tooltip title={t('acmeCertPage.copy')}>
                <Button
                    icon={<CopyOutlined />}
                    onClick={handleCopy}
                    size="small"
                    type="text"
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                    }}
                />
            </Tooltip>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{code}</pre>
        </Card>
    );
};

const InfoItem = ({ title, children }: { title: string, children: React.ReactNode}) => (
    <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 4 }}>{title}</Title>
        {children}
    </div>
)


export const CertShow = () => {
    const { query } = useShow();
    const { data, isLoading } = query;
    const record = data?.data;
    const { t } = useTranslation();
    const statusMap = getStatusMap();

    const [privateKey, setPrivateKey] = useState<string | null>(null);

    const { data: canViewPrivateKey } = useCan({
        resource: "acme/certificates",
        action: "private_key_read",
        params: { id: record?.id },
    });

    const [isFetchingPrivateKey, setIsFetchingPrivateKey] = useState(false);

    const handleViewPrivateKey = async () => {
        if (!record?.id) return;

        setIsFetchingPrivateKey(true);
        try {
            const response = await fetch(`${API_BASE_URL}/acme/certificates/${record.id}/private-key-content`, {
                credentials: 'include', //
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('acmeCertPage.getPrivateKeyFailed'));
            }
            const data = await response.json();
            setPrivateKey(data?.private_key);
        } catch (error) {
            message.error(t('acmeCertPage.getPrivateKeyFailed') + ": " + (error as any).message);
        } finally {
            setIsFetchingPrivateKey(false);
        }
    };

    const getStatusText = (status?: string) => {
        if (!status) return '-';
        return (statusMap as Record<string, any>)[status]?.label || status;
    };

    const getStatusColor = (status?: string) => {
        if (!status) return 'default';
        return (statusMap as Record<string, any>)[status]?.color || 'default';
    };

    const calculateRemainingDays = (issuedAt: string | null, validityDays: number) => {
        if (!issuedAt || !validityDays) {
            return { text: '-', color: 'default' };
        }

        const issuedDate = new Date(issuedAt);
        const expiryDate = new Date(issuedDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        const remainingMs = expiryDate.getTime() - now.getTime();
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

        if (remainingDays <= 0) {
            return { text: t('acmeCertPage.expired'), color: 'red' };
        }
        if (remainingDays <= 30) {
            return { text: `${remainingDays}${t('acmeCertPage.days')}`, color: 'orange' };
        }
        return { text: `${remainingDays}${t('acmeCertPage.days')}`, color: 'green' };
    };

    const remaining = record ? calculateRemainingDays(record.issued_at, record.validity_days) : { text: '-', color: 'default' };

    return (
        <Show isLoading={isLoading}>
            <Row gutter={24}>
                <Col span={12}>
                    <InfoItem title={t('acmeCertPage.id')}>
                        <TextField value={record?.id} />
                    </InfoItem>
                </Col>
                <Col span={12}>
                    <InfoItem title={t('acmeCertPage.domains')}>
                        {record?.domains?.map((item: any) => (
                            <TagField value={item} key={item} style={{ marginRight: 4 }}/>
                        ))}
                    </InfoItem>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col span={6}>
                    <InfoItem title={t('acmeCertPage.status')}>
                        <Tag color={getStatusColor(record?.cert_status)}>
                            {getStatusText(record?.cert_status)}
                        </Tag>
                    </InfoItem>
                </Col>
                 <Col span={6}>
                    <InfoItem title={t('acmeCertPage.keyType')}>
                        <TextField value={record?.key_type} />
                    </InfoItem>
                </Col>
                <Col span={6}>
                    <InfoItem title={t('acmeCertPage.certificateType')}>
                        <TextField value={record?.cert_type} />
                    </InfoItem>
                </Col>
                <Col span={6}>
                    <InfoItem title={t('acmeCertPage.remainingDays')}>
                        <Tag color={remaining.color}>{remaining.text}</Tag>
                    </InfoItem>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col span={12}>
                    <InfoItem title={t('acmeCertPage.issuedAt')}>
                        <DateField value={record?.issued_at} format="YYYY-MM-DD HH:mm:ss" />
                    </InfoItem>
                </Col>
                <Col span={12}>
                    <InfoItem title={t('acmeCertPage.createdAt')}>
                        <DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" />
                    </InfoItem>
                </Col>
            </Row>
            
            <InfoItem title={t('acmeCertPage.privateKey')}>
                {privateKey ? (
                    <CodeBlock code={privateKey} />
                ) : (
                    canViewPrivateKey?.can && (
                        <Button
                            onClick={handleViewPrivateKey}
                            loading={isFetchingPrivateKey}
                        >
                            {t('acmeCertPage.viewPrivateKey')}
                        </Button>
                    )
                )}
            </InfoItem>
            
            <InfoItem title={t('acmeCertPage.certChain')}>
                <CodeBlock code={record?.certificate} />
            </InfoItem>
            
            <InfoItem title={t('acmeCertPage.certUrl')}>
                <TextField copyable value={record?.cert_url} />
            </InfoItem>
            <InfoItem title={t('acmeCertPage.certStableUrl')}>
                <TextField copyable value={record?.cert_stable_url} />
            </InfoItem>
        </Show>
    );
};
