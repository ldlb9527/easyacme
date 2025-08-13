import React, { useState, useEffect } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker, Select } from "antd";
import dayjs from "dayjs";
import { useTranslation } from 'react-i18next';

export const DNSEdit = () => {
    const { formProps, saveButtonProps, query } = useForm();
    const [selectedType, setSelectedType] = useState('tencentcloud');
    const { t } = useTranslation();

    const dNSData = query?.data?.data;

    const providerOptions = [
        { label: t('dnsProviderPage.tencentcloud'), value: 'tencentcloud' },
        { label: t('dnsProviderPage.aliyun'), value: 'aliyun' },
        { label: t('dnsProviderPage.huaweicloud'), value: 'huaweicloud' },
        { label: t('dnsProviderPage.baiducloud'), value: 'baiducloud' },
        { label: 'Cloudflare', value: 'cloudflare' },
        { label: 'GoDaddy', value: 'godaddy' },
        { label: 'AWS Route53', value: 'route53' },
    ];

    // 获取授权字段的键名
    const getCredentialKeys = (type: string) => {
        const keyMap: { [key: string]: { idKey: string; keyKey: string; idPlaceholder: string; keyPlaceholder: string } } = {
            'tencentcloud': { 
                idKey: 'TENCENT_SECRET_ID', 
                keyKey: 'TENCENT_SECRET_KEY',
                idPlaceholder: '请输入腾讯云SecretId',
                keyPlaceholder: '请输入腾讯云SecretKey'
            },
            'aliyun': { 
                idKey: 'ALIYUN_ACCESS_KEY_ID', 
                keyKey: 'ALIYUN_ACCESS_KEY_SECRET',
                idPlaceholder: '请输入阿里云AccessKeyId',
                keyPlaceholder: '请输入阿里云AccessKeySecret'
            },
            'huaweicloud': { 
                idKey: 'HUAWEICLOUD_ACCESS_KEY_ID', 
                keyKey: 'HUAWEICLOUD_SECRET_ACCESS_KEY',
                idPlaceholder: '请输入华为云Access Key ID',
                keyPlaceholder: '请输入华为云Secret Access Key'
            },
            'baiducloud': { 
                idKey: 'BAIDUCLOUD_ACCESS_KEY_ID', 
                keyKey: 'BAIDUCLOUD_SECRET_ACCESS_KEY',
                idPlaceholder: '请输入百度云Access Key',
                keyPlaceholder: '请输入百度云Secret Access Key'
            },
            'cloudflare': { 
                idKey: 'CLOUDFLARE_API_TOKEN', 
                keyKey: 'CLOUDFLARE_ZONE_ID',
                idPlaceholder: '请输入Cloudflare API Token',
                keyPlaceholder: '请输入Cloudflare Zone ID'
            },
            'godaddy': { 
                idKey: 'GODADDY_API_KEY', 
                keyKey: 'GODADDY_API_SECRET',
                idPlaceholder: '请输入GoDaddy API Key',
                keyPlaceholder: '请输入GoDaddy API Secret'
            },
            'route53': { 
                idKey: 'AWS_ACCESS_KEY_ID', 
                keyKey: 'AWS_SECRET_ACCESS_KEY',
                idPlaceholder: '请输入AWS Access Key ID',
                keyPlaceholder: '请输入AWS Secret Access Key'
            },
        };
        return keyMap[type] || { 
            idKey: 'SECRET_ID', 
            keyKey: 'SECRET_KEY',
            idPlaceholder: '请输入授权ID',
            keyPlaceholder: '请输入授权KEY'
        };
    };

    const currentKeys = getCredentialKeys(selectedType);

    // 监听数据加载，设置初始type值
    useEffect(() => {
        if (dNSData?.type) {
            setSelectedType(dNSData.type);
        }
    }, [dNSData]);

    const handleTypeChange = (value: string) => {
        setSelectedType(value);
    };

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item
                    label={t('dnsProviderPage.id')}
                    name={["id"]}
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Input readOnly disabled />
                </Form.Item>
                <Form.Item
                    label={t('dnsProviderPage.createdAt')}
                    name={["created_at"]}
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                    getValueProps={(value) => ({
                        value: value ? dayjs(value) : undefined,
                    })}
                >
                    <DatePicker disabled />
                </Form.Item>
                <Form.Item
                    label={t('dnsProviderPage.updatedAt')}
                    name={["updated_at"]}
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                    getValueProps={(value) => ({
                        value: value ? dayjs(value) : undefined,
                    })}
                >
                    <DatePicker disabled />
                </Form.Item>
                <Form.Item
                    label={t('dnsProviderPage.name')}
                    name={["name"]}
                    rules={[
                        {
                            required: true,
                            message: t('dnsProviderPage.enterName'),
                        },
                    ]}
                >
                    <Input placeholder={t('dnsProviderPage.enterName')} />
                </Form.Item>
                <Form.Item
                    label={t('dnsProviderPage.type')}
                    name={["type"]}
                    rules={[
                        {
                            required: true,
                            message: t('dnsProviderPage.selectType'),
                        },
                    ]}
                >
                    <Select 
                        placeholder={t('dnsProviderPage.selectType')}
                        options={providerOptions}
                        onChange={handleTypeChange}
                    />
                </Form.Item>
                <Form.Item
                    label={currentKeys.idKey}
                    name={["secret_id"]}
                    rules={[
                        {
                            required: true,
                            message: t('dnsProviderPage.enterSecretId', { key: currentKeys.idKey }),
                        },
                    ]}
                >
                    <Input placeholder={currentKeys.idPlaceholder} />
                </Form.Item>
                <Form.Item
                    label={currentKeys.keyKey}
                    name={["secret_key"]}
                    rules={[
                        {
                            required: true,
                            message: t('dnsProviderPage.enterSecretKey', { key: currentKeys.keyKey }),
                        },
                    ]}
                >
                    <Input.Password placeholder={currentKeys.keyPlaceholder} />
                </Form.Item>
                <Form.Item
                    label={t('dnsProviderPage.notes')}
                    name={["notes"]}
                    rules={[
                        {
                            required: false,
                        },
                    ]}
                >
                    <Input.TextArea 
                        placeholder={t('dnsProviderPage.enterNotes')} 
                        rows={3}
                        maxLength={200}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Edit>
    );
};
