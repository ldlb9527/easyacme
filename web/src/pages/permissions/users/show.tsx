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
} from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export const UserShow = () => {
    const { query } = useShow();
    const { data, isLoading } = query;
    const record = data?.data;

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
                                    {record?.name || "DNS 记录"}
                                </Title>
                                <Text type="secondary" style={{ fontSize: 16 }}>
                                    ID: {record?.id}
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
                            <Descriptions.Item label="创建时间">
                                {record?.created_at
                                    ? dayjs(record.created_at).format("YYYY-MM-DD HH:mm:ss")
                                    : "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="更新时间">
                                {record?.updated_at
                                    ? dayjs(record.updated_at).format("YYYY-MM-DD HH:mm:ss")
                                    : "-"}
                            </Descriptions.Item>
                            <Descriptions.Item label="名称">{record?.name}</Descriptions.Item>
                            <Descriptions.Item label="类型">{record?.type}</Descriptions.Item>
                            <Descriptions.Item label="Secret ID">{record?.secret_id ?? "-"}</Descriptions.Item>
                            <Descriptions.Item label="Secret Key">{record?.secret_key ?? "-"}</Descriptions.Item>
                            <Descriptions.Item label="备注">{record?.notes}</Descriptions.Item>
                        </Descriptions>
                    </div>
                </Card>
            </div>
        </Show>
    );
};