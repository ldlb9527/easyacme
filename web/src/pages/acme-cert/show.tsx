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

const { Title, Text } = Typography;

const CodeBlock = ({ code, maxHeight = "300px" }: { code?: string; maxHeight?: string }) => {
    if (!code) {
        return <Text type="secondary">暂无数据</Text>;
    }

    const handleCopy = () => {
        if(code) {
            navigator.clipboard.writeText(code);
            message.success("已复制到剪贴板");
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
            <Tooltip title="复制">
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
                throw new Error(errorData.error || "获取私钥失败");
            }
            const data = await response.json();
            setPrivateKey(data?.private_key);
        } catch (error) {
            message.error("获取私钥失败: " + (error as any).message);
        } finally {
            setIsFetchingPrivateKey(false);
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'issued': return '已签发';
            case 'expired': return '已过期';
            case 'not_issued': return '未签发';
            case 'revoked': return '已吊销';
            default: return status || '-';
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'issued': return 'green';
            case 'expired': return 'red';
            case 'not_issued': return 'orange';
            case 'revoked': return 'gray';
            default: return 'default';
        }
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
            return { text: '已过期', color: 'red' };
        }
        if (remainingDays <= 30) {
            return { text: `${remainingDays}天`, color: 'orange' };
        }
        return { text: `${remainingDays}天`, color: 'green' };
    };

    const remaining = record ? calculateRemainingDays(record.issued_at, record.validity_days) : { text: '-', color: 'default' };

    return (
        <Show isLoading={isLoading}>
            <Row gutter={24}>
                <Col span={12}>
                    <InfoItem title="ID">
                        <TextField value={record?.id} />
                    </InfoItem>
                </Col>
                <Col span={12}>
                    <InfoItem title="域名">
                        {record?.domains?.map((item: any) => (
                            <TagField value={item} key={item} style={{ marginRight: 4 }}/>
                        ))}
                    </InfoItem>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col span={6}>
                    <InfoItem title="状态">
                        <Tag color={getStatusColor(record?.cert_status)}>
                            {getStatusText(record?.cert_status)}
                        </Tag>
                    </InfoItem>
                </Col>
                 <Col span={6}>
                    <InfoItem title="密钥类型">
                        <TextField value={record?.key_type} />
                    </InfoItem>
                </Col>
                <Col span={6}>
                    <InfoItem title="证书类型">
                        <TextField value={record?.cert_type} />
                    </InfoItem>
                </Col>
                <Col span={6}>
                    <InfoItem title="剩余有效期">
                        <Tag color={remaining.color}>{remaining.text}</Tag>
                    </InfoItem>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col span={12}>
                    <InfoItem title="签发时间">
                        <DateField value={record?.issued_at} format="YYYY-MM-DD HH:mm:ss" />
                    </InfoItem>
                </Col>
                <Col span={12}>
                    <InfoItem title="创建时间">
                        <DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" />
                    </InfoItem>
                </Col>
            </Row>
            
            <InfoItem title="私钥">
                {privateKey ? (
                    <CodeBlock code={privateKey} />
                ) : (
                    canViewPrivateKey?.can && (
                        <Button
                            onClick={handleViewPrivateKey}
                            loading={isFetchingPrivateKey}
                        >
                            查看私钥
                        </Button>
                    )
                )}
            </InfoItem>
            
            <InfoItem title="证书链">
                <CodeBlock code={record?.certificate} />
            </InfoItem>
            
            <InfoItem title="证书 URL">
                <TextField copyable value={record?.cert_url} />
            </InfoItem>
            <InfoItem title="证书稳定 URL">
                <TextField copyable value={record?.cert_stable_url} />
            </InfoItem>
        </Show>
    );
};
