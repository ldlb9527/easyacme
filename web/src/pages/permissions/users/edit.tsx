import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, DatePicker, ConfigProvider } from "antd";
import dayjs from "dayjs";
import { useTranslation } from 'react-i18next';
import zhCN from 'antd/locale/zh_CN';

export const UserEdit = () => {
    const { formProps, saveButtonProps, query } = useForm();
    const { t } = useTranslation();

    const dNSData = query?.data?.data;

    return (
        <ConfigProvider locale={zhCN}>
            <Edit saveButtonProps={saveButtonProps}>
                <Form {...formProps} layout="vertical">
                    <Form.Item
                        label={t('userPage.id')}
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
                        label={t('userPage.createdAt')}
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
                        <DatePicker />
                    </Form.Item>
                    <Form.Item
                        label={t('userPage.updatedAt')}
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
                        <DatePicker />
                    </Form.Item>
                    <Form.Item
                        label={t('userPage.name')}
                        name={["name"]}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={t('userPage.type')}
                        name={["type"]}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={t('userPage.secretKey')}
                        name={["secret_key"]}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label={t('userPage.notes')}
                        name={["notes"]}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Edit>
        </ConfigProvider>
    );
};
