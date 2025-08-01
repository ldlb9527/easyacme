import React from "react";
import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import {
    Card,
    Descriptions,
    Typography,
    Row,
    Col,
    Divider,
    ConfigProvider
} from "antd";
import dayjs from "dayjs";
import { useTranslation } from 'react-i18next';
import zhCN from 'antd/locale/zh_CN';

const { Title, Text } = Typography;

export const UserShow = () => {
    const { query } = useShow();
    const { data, isLoading } = query;
    const record = data?.data;
    const { t } = useTranslation();

    return (
        <ConfigProvider locale={zhCN}>
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
                            minHeight: "100vh",
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
                                        {record?.name || t('userPage.details')}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 16 }}>
                                        {t('userPage.id')}: {record?.id}
                                    </Text>
                                </Col>
                            </Row>

                            <Divider />

                            {/* 详情信息 */}
                            <Descriptions
                                column={2}
                                size="middle"
                                bordered
                                style={{ background: "#fff", padding: 16, borderRadius: 8 }}
                            >
                                <Descriptions.Item label={t('userPage.createdAt')}>
                                    {record?.created_at
                                        ? dayjs(record.created_at).format("YYYY-MM-DD HH:mm:ss")
                                        : "-"}
                                </Descriptions.Item>
                                <Descriptions.Item label={t('userPage.updatedAt')}>
                                    {record?.updated_at
                                        ? dayjs(record.updated_at).format("YYYY-MM-DD HH:mm:ss")
                                        : "-"}
                                </Descriptions.Item>
                                <Descriptions.Item label={t('userPage.name')}>{record?.name}</Descriptions.Item>
                                <Descriptions.Item label={t('userPage.type')}>{record?.type}</Descriptions.Item>
                                <Descriptions.Item label="Secret ID">{record?.secret_id ?? "-"}</Descriptions.Item>
                                <Descriptions.Item label={t('userPage.secretKey')}>{record?.secret_key ?? "-"}</Descriptions.Item>
                                <Descriptions.Item label={t('userPage.notes')}>{record?.notes}</Descriptions.Item>
                            </Descriptions>
                        </div>
                    </Card>
                </div>
            </Show>
        </ConfigProvider>
    );
};