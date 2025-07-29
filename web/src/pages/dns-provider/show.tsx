import React, { useState } from "react";
import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import {
    Card,
    Descriptions,
    Typography,
    Row,
    Col,
    Divider,
    Tag,
    Button,
    message,
    Tooltip,
} from "antd";
import dayjs from "dayjs";
import { CopyOutlined } from "@ant-design/icons";
import { API_BASE_URL } from "../../config";
import { useTranslation } from 'react-i18next';

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


export const DNSShow = () => {
    const { query } = useShow();
    const { data, isLoading } = query;
    const record = data?.data;

    const [secretKey, setSecretKey] = useState<string | null>(null);
    const [isFetchingSecret, setIsFetchingSecret] = useState(false);
    const { t } = useTranslation();

    const handleViewSecretKey = async () => {
        if (!record?.id) return;

        setIsFetchingSecret(true);
        try {
            const response = await fetch(`${API_BASE_URL}/dns/provider/${record.id}/secrets`, {
                credentials: 'include',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "获取密钥失败");
            }
            const data = await response.json();
            setSecretKey(data?.secret_key);
        } catch (error) {
            message.error("获取密钥失败: " + (error as any).message);
        } finally {
            setIsFetchingSecret(false);
        }
    };

    // 获取厂商类型显示名称
    const getProviderTypeName = (type: string) => {
        const typeMap: { [key: string]: { name: string; color: string } } = {
            'tencentcloud': { name: t('dnsProviderPage.tencentcloud'), color: 'blue' },
            'aliyun': { name: t('dnsProviderPage.aliyun'), color: 'orange' },
            'huaweicloud': { name: t('dnsProviderPage.huaweicloud'), color: 'red' },
            'baiducloud': { name: t('dnsProviderPage.baiducloud'), color: 'purple' },
            'cloudflare': { name: 'Cloudflare', color: 'geekblue' },
            'godaddy': { name: 'GoDaddy', color: 'green' },
        };
        return typeMap[type] || { name: type || t('dnsProviderPage.unknown'), color: 'default' };
    };

    // 获取授权字段的键名
    const getCredentialKeys = (type: string) => {
        const keyMap: { [key: string]: { idKey: string; keyKey: string } } = {
            'tencentcloud': { idKey: 'TENCENT_SECRET_ID', keyKey: 'TENCENT_SECRET_KEY' },
            'aliyun': { idKey: 'ALIYUN_ACCESS_KEY_ID', keyKey: 'ALIYUN_ACCESS_KEY_SECRET' },
            'huaweicloud': { idKey: 'HUAWEICLOUD_ACCESS_KEY_ID', keyKey: 'HUAWEICLOUD_SECRET_ACCESS_KEY' },
            'baiducloud': { idKey: 'BAIDUCLOUD_ACCESS_KEY_ID', keyKey: 'BAIDUCLOUD_SECRET_ACCESS_KEY' },
            'cloudflare': { idKey: 'CLOUDFLARE_API_TOKEN', keyKey: 'CLOUDFLARE_ZONE_ID' },
            'godaddy': { idKey: 'GODADDY_API_KEY', keyKey: 'GODADDY_API_SECRET' },
        };
        return keyMap[type] || { idKey: 'SECRET_ID', keyKey: 'SECRET_KEY' };
    };

    const typeInfo = getProviderTypeName(record?.type);
    const credentialKeys = getCredentialKeys(record?.type);



    return (
        <Show isLoading={isLoading}>
            <Card bordered={false}>
                <Descriptions bordered column={2} title={t('dnsProviderPage.details')}>
                    <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
                    <Descriptions.Item label={t('dnsProviderPage.name')}>{record?.name}</Descriptions.Item>

                    <Descriptions.Item label={t('dnsProviderPage.type')}>
                        <Tag color={typeInfo.color}>{typeInfo.name}</Tag>
                    </Descriptions.Item>
                     <Descriptions.Item label={t('dnsProviderPage.notes')}>{record?.notes || '-'}</Descriptions.Item>

                    <Descriptions.Item label={credentialKeys.idKey} span={2}>
                        <Text copyable>{record?.secret_id || '-'}</Text>
                    </Descriptions.Item>

                    <Descriptions.Item label={credentialKeys.keyKey} span={2}>
                        {secretKey ? (
                            <CodeBlock code={secretKey} />
                        ) : (
                            <Button
                                onClick={handleViewSecretKey}
                                loading={isFetchingSecret}
                            >
                                {t('dnsProviderPage.viewSecretKey')}
                            </Button>
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label={t('dnsProviderPage.createdAt')}>
                        {record?.created_at ? dayjs(record.created_at).format("YYYY-MM-DD HH:mm:ss") : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('dnsProviderPage.updatedAt')}>
                        {record?.updated_at ? dayjs(record.updated_at).format("YYYY-MM-DD HH:mm:ss") : "-"}
                    </Descriptions.Item>
                </Descriptions>
            </Card>
        </Show>
    );
};