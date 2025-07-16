import React, { useState, useEffect } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker, Select } from "antd";
import dayjs from "dayjs";

export const DNSEdit = () => {
    const { formProps, saveButtonProps, query } = useForm();
    const [selectedType, setSelectedType] = useState('tencentcloud');

    const dNSData = query?.data?.data;

    const providerOptions = [
        { label: '腾讯云', value: 'tencentcloud' },
        { label: '阿里云', value: 'aliyun' },
        { label: '华为云', value: 'huaweicloud' },
        { label: '百度云', value: 'baiducloud' },
        { label: 'Cloudflare', value: 'cloudflare' },
        { label: 'GoDaddy', value: 'godaddy' },
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
                    label="ID"
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
                    label="创建时间"
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
                    label="更新时间"
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
                    label="名称"
                    name={["name"]}
                    rules={[
                        {
                            required: true,
                            message: '请输入DNS提供商名称',
                        },
                    ]}
                >
                    <Input placeholder="请输入DNS提供商名称" />
                </Form.Item>
                <Form.Item
                    label="厂商类型"
                    name={["type"]}
                    rules={[
                        {
                            required: true,
                            message: '请选择厂商类型',
                        },
                    ]}
                >
                    <Select 
                        placeholder="请选择厂商类型"
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
                            message: `请输入${currentKeys.idKey}`,
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
                            message: `请输入${currentKeys.keyKey}`,
                        },
                    ]}
                >
                    <Input.Password placeholder={currentKeys.keyPlaceholder} />
                </Form.Item>
                <Form.Item
                    label="备注"
                    name={["notes"]}
                    rules={[
                        {
                            required: false,
                        },
                    ]}
                >
                    <Input.TextArea 
                        placeholder="请输入备注信息（可选）" 
                        rows={3}
                        maxLength={200}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Edit>
    );
};
