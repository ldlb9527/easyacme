import React, { useState } from "react";
import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import {
    Card,
    Descriptions,
    Typography,
    Tag,
    Row,
    Col,
    Tooltip,
    Button,
    Space,
    message,
    Divider,
} from "antd";
import { CopyOutlined, EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from 'react-i18next';
import { getStatusMap } from "./status";

const { Title, Text } = Typography;

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("已复制到剪贴板");
};

export const ACMEShow = () => {
    const { query } = useShow();
    const { data, isLoading } = query;
    const record = data?.data;
    const [showKeyPem, setShowKeyPem] = useState(false);
    const [showEabMacKey, setShowEabMacKey] = useState(false);
    const { t } = useTranslation();
    const statusMap = getStatusMap();

    return (
        <Show isLoading={isLoading}>
            <div
                style={{
                    width: "100%",
                    minHeight: "100vh",
                    background: "#f8fafc",
                    margin: 0,
                    padding: 0,
                    overflowX: "hidden",
                }}
            >
                <Card
                    bordered={false}
                    style={{
                        width: "100%",
                        margin: 0,
                        padding: 0,
                        background: "#fff",
                        boxShadow: "none",
                        borderRadius: 0,
                        minHeight: "100vh", // 关键：让内容区填满整个视口高度
                        display: "flex",
                        flexDirection: "column",
                    }}
                    bodyStyle={{ padding: 0 }}
                >
                    <div style={{ padding: 16 }}>
                        {/* 顶部关键信息 */}
                        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                            <Col flex="auto">
                                <Title level={3} style={{ margin: 0 }}>
                                    {record?.name || t('acmeAccountPage.details')}
                                </Title>
                                <Text type="secondary" style={{ fontSize: 16 }}>
                                    {t('acmeAccountPage.id')}: {record?.id}
                                </Text>
                            </Col>
                        </Row>
                        <Row style={{ marginBottom: 24 }}>
                            <Col>
                                <Text strong style={{ marginRight: 8 }}>{t('acmeAccountPage.status')}：</Text>
                                <Tag color={(statusMap as Record<string, any>)[record?.status]?.color || "default"} style={{ fontSize: 16, padding: "4px 16px" }}>
                                    {(statusMap as Record<string, any>)[record?.status]?.label || record?.status}
                                </Tag>
                            </Col>
                        </Row>

                        <Divider />

                        {/* 合并所有详情信息 */}
                        <Descriptions
                            column={2}
                            size="middle"
                            bordered
                            style={{ background: "#fff", padding: 16, borderRadius: 8 }}
                        >
                            <Descriptions.Item label={t('acmeAccountPage.email')}>{record?.email}</Descriptions.Item>
                            <Descriptions.Item label={t('acmeAccountPage.keyType')}>{record?.key_type}</Descriptions.Item>
                            <Descriptions.Item label={t('acmeAccountPage.eabKeyId')}>{record?.eab_key_id}</Descriptions.Item>
                            <Descriptions.Item label={t('acmeAccountPage.eabHmacKey')}>
                                <Space>
                                    <Text copyable={{ text: record?.eab_mac_key }}>
                                        {showEabMacKey ? record?.eab_mac_key : "******"}
                                    </Text>
                                    <Button
                                        size="small"
                                        icon={showEabMacKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                        onClick={() => setShowEabMacKey((v) => !v)}
                                    />
                                </Space>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('acmeAccountPage.uri')}>{record?.uri}</Descriptions.Item>
                            <Descriptions.Item label={t('acmeAccountPage.server')}>{record?.server}</Descriptions.Item>
                            <Descriptions.Item label={t('acmeAccountPage.createdAt')}>
                                {record?.created_at ? dayjs(record.created_at).format("YYYY-MM-DD HH:mm:ss") : "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('acmeAccountPage.updatedAt')}>
                                {record?.updated_at ? dayjs(record.updated_at).format("YYYY-MM-DD HH:mm:ss") : "-"}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        {/* 私钥 Key Pem 区块 */}
                        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                            <Text strong style={{ marginBottom: 8 }}>{t('acmeAccountPage.keyPem')}</Text>
                            <div
                                style={{
                                    position: "relative",
                                    display: "inline-block",
                                    background: "#f5f5f5",
                                    border: "1px solid #eee",
                                    borderRadius: 6,
                                    padding: "16px 40px 16px 16px",
                                    fontSize: 13,
                                    minHeight: 120,
                                    minWidth: 320,
                                    maxWidth: "100%",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all",
                                }}
                            >
                                {/* 复制和显示/隐藏按钮，放在框内右上角 */}
                                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 8 }}>
                                    <Tooltip title={t('acmeAccountPage.copied')}>
                                        <Button
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() => {
                                                navigator.clipboard.writeText(record?.key_pem);
                                                message.success(t('acmeAccountPage.copied'));
                                            }}
                                        />
                                    </Tooltip>
                                    <Tooltip title={showKeyPem ? t('acmeAccountPage.noOption') : t('acmeAccountPage.yesOption')}>
                                        <Button
                                            size="small"
                                            icon={showKeyPem ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                            onClick={() => setShowKeyPem((v) => !v)}
                                        />
                                    </Tooltip>
                                </div>
                                <pre style={{ margin: 0, background: "none", padding: 0 }}>
                                    {showKeyPem ? record?.key_pem : "******"}
                                </pre>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </Show>
    );
};