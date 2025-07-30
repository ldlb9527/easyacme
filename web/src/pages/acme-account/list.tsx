import React, { useState } from "react";
import {BaseRecord, useGo, useCustomMutation} from "@refinedev/core";
import {DateField, DeleteButton, EditButton, EmailField, List, ShowButton, useTable,} from "@refinedev/antd";
import {Space, Table, Tag, Button, Popconfirm, message, Card, Typography, ConfigProvider, theme, Select, Input, Form} from "antd";
import { getStatusMap } from "./status";
import { API_BASE_URL } from '../../config';
import { DeleteOutlined, StopOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export const ACMEList = () => {
    const [localFilters, setLocalFilters] = useState<any[]>([]);
    
    const {tableProps, tableQueryResult} = useTable({
        syncWithLocation: false,
        pagination: {
            pageSize: 10,
        },
        queryOptions: {
            refetchOnWindowFocus: false,
        },
        filters: {
            permanent: localFilters,
        },
    });
    const { token } = theme.useToken();
    const go = useGo();
    const { mutateAsync } = useCustomMutation();
    const { t } = useTranslation();
    const statusMap = getStatusMap();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [selectedRows, setSelectedRows] = useState<BaseRecord[]>([]);
    
    // 批量删除
    const handleBatchDelete = async () => {
        try {
            await Promise.all(
                selectedRows.map(record => 
                    mutateAsync({
                        url: `${API_BASE_URL}/acme/accounts/${record.id}`,
                        method: "delete",
                        values: {},
                    })
                )
            );
            message.success(t('acmeAccountPage.batchDeleteSuccess', { count: selectedRows.length }));
            setSelectedRowKeys([]);
            setSelectedRows([]);
            tableQueryResult.refetch();
        } catch (error) {
            message.error(t('acmeAccountPage.batchDeleteFailed') + (error as any).message);
        }
    };

    // 批量吊销
    const handleBatchDeactivate = async () => {
        try {
            await Promise.all(
                selectedRows.map(record => 
                    mutateAsync({
                        url: `${API_BASE_URL}/acme/accounts/${record.id}/deactivate`,
                        method: "post",
                        values: {},
                    })
                )
            );
            message.success(t('acmeAccountPage.batchDeactivateSuccess', { count: selectedRows.length }));
            setSelectedRowKeys([]);
            setSelectedRows([]);
            tableQueryResult.refetch();
        } catch (error) {
            message.error(t('acmeAccountPage.batchDeactivateFailed') + (error as any).message);
        }
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: BaseRecord[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
            setSelectedRows(newSelectedRows);
        },
        columnWidth: 60,
    };

    // 状态选项
    const statusOptions = Object.entries(statusMap).map(([key, value]) => ({
        label: <Tag color={value.color}>{value.label}</Tag>,
        value: key,
    }));

    // EAB绑定选项
    const eabOptions = [
        { label: <Tag color="green">{t('acmeAccountPage.yesOption')}</Tag>, value: true },
        { label: <Tag color="default">{t('acmeAccountPage.noOption')}</Tag>, value: false },
    ];

    // 获取当前筛选值
    const getCurrentFilterValue = (field: string) => {
        const filter = localFilters.find((f: any) => f.field === field);
        return filter?.value;
    };

    // 更新筛选条件
    const updateFilters = (field: string, value: any, operator: string = "eq") => {
        let newFilters = localFilters.filter((f: any) => f.field !== field);
        if (value !== undefined && value !== null && value !== '') {
            newFilters.push({ field, operator, value });
        }
        setLocalFilters(newFilters);
    };

    // 处理名称搜索
    const handleNameSearch = (value: string) => {
        updateFilters("name", value, "contains");
    };

    // 处理状态筛选
    const handleStatusFilter = (value: string | undefined) => {
        updateFilters("status", value);
    };

    // 处理EAB绑定筛选
    const handleEabFilter = (value: boolean | undefined) => {
        updateFilters("bind_eab", value);
    };

    // 获取当前筛选值
    const currentNameFilter = getCurrentFilterValue("name") || "";
    const currentStatusFilter = getCurrentFilterValue("status");
    const currentEabFilter = getCurrentFilterValue("bind_eab");

    // 清除筛选
    const handleClearFilters = () => {
        setLocalFilters([]);
    };

    return (
        <ConfigProvider locale={zhCN}>
            <List
                canCreate={false}
                title=""
            >
                {/* 筛选条件栏 - 参考DNS列表样式 */}
                <Card 
                    style={{ 
                        marginBottom: 16,
                        borderRadius: 8,
                        backgroundColor: token.colorFillQuaternary,
                    }}
                    bodyStyle={{ 
                        padding: '20px 24px',
                    }}
                >
                    <Form
                        layout="inline"
                        style={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '16px',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: '#595959' }}>{t('acmeAccountPage.name')}</span>}
                                style={{ marginBottom: 0 }}
                            >
                                <Input.Search
                                    style={{ width: 200 }}
                                    placeholder={t('acmeAccountPage.searchName')}
                                    value={currentNameFilter}
                                    onChange={(e) => handleNameSearch(e.target.value)}
                                    onSearch={handleNameSearch}
                                    allowClear
                                />
                            </Form.Item>
                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: '#595959' }}>{t('acmeAccountPage.status')}</span>}
                                style={{ marginBottom: 0 }}
                            >
                                <Select
                                    style={{ width: 140 }}
                                    placeholder={t('acmeAccountPage.selectStatus')}
                                    value={currentStatusFilter}
                                    onChange={handleStatusFilter}
                                    options={statusOptions}
                                    allowClear
                                    dropdownStyle={{
                                        borderRadius: 6,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}
                                />
                            </Form.Item>
                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: '#595959' }}>{t('acmeAccountPage.bindEAB')}</span>}
                                style={{ marginBottom: 0 }}
                            >
                                <Select
                                    style={{ width: 120 }}
                                    placeholder={t('acmeAccountPage.selectEAB')}
                                    value={currentEabFilter}
                                    onChange={handleEabFilter}
                                    options={eabOptions}
                                    allowClear
                                    dropdownStyle={{
                                        borderRadius: 6,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                    }}
                                />
                            </Form.Item>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => go({ to: { resource: "acme/accounts", action: "create" } })}
                            >
                                {t('acmeAccountPage.create')}
                            </Button>
                        </div>
                    </Form>
                </Card>

                {/* 批量操作栏 */}
                {selectedRowKeys.length > 0 && (
                    <Card 
                        size="small" 
                        style={{ 
                            marginBottom: 16, 
                            background: token.colorInfoBg,
                            border: `1px solid ${token.colorInfoBorder}`,
                            borderRadius: 8,
                        }}
                    >
                        <Space>
                            <Text>已选择 <Text strong>{selectedRowKeys.length}</Text> 项</Text>
                            <Popconfirm
                                title={t('acmeAccountPage.batchDeactivate')}
                                description={t('acmeAccountPage.confirmBatchDeactivate', { count: selectedRowKeys.length })}
                                onConfirm={handleBatchDeactivate}
                                okText={t('acmeAccountPage.confirm')}
                                cancelText={t('acmeAccountPage.cancel')}
                            >
                                <Button size="small" icon={<StopOutlined />}>
                                    {t('acmeAccountPage.batchDeactivate')}
                                </Button>
                            </Popconfirm>
                            <Popconfirm
                                title={t('acmeAccountPage.batchDelete')}
                                description={t('acmeAccountPage.confirmBatchDelete', { count: selectedRowKeys.length })}
                                onConfirm={handleBatchDelete}
                                okText={t('acmeAccountPage.confirm')}
                                cancelText={t('acmeAccountPage.cancel')}
                            >
                                <Button size="small" danger icon={<DeleteOutlined />}>
                                    {t('acmeAccountPage.batchDelete')}
                                </Button>
                            </Popconfirm>
                            <Button 
                                size="small" 
                                onClick={() => {
                                    setSelectedRowKeys([]);
                                    setSelectedRows([]);
                                }}
                            >
                                {t('acmeAccountPage.cancelSelection')}
                            </Button>
                        </Space>
                    </Card>
                )}
                
                <Table 
                    {...tableProps} 
                    rowKey="id"
                    rowSelection={rowSelection}
                    size="middle"
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        style: { marginTop: 16 }
                    }}
                    scroll={{ y: 'calc(100vh - 330px)', x: 'max-content' }}
                >
                
                    {/* 优化复选框样式 */}
                    <style>{`
                        .ant-checkbox-wrapper .ant-checkbox {
                            border-color: #6366f1 !important;
                        }
                        
                        .ant-checkbox-wrapper .ant-checkbox-inner {
                            border-color: #6366f1 !important;
                            border-width: 2px !important;
                        }
                        
                        .ant-checkbox-wrapper:hover .ant-checkbox-inner {
                            border-color: #4f46e5 !important;
                        }
                        
                        .ant-checkbox-wrapper .ant-checkbox-checked .ant-checkbox-inner {
                            background-color: #6366f1 !important;
                            border-color: #6366f1 !important;
                        }
                        
                        .ant-checkbox-wrapper .ant-checkbox-indeterminate .ant-checkbox-inner {
                            background-color: #6366f1 !important;
                            border-color: #6366f1 !important;
                        }
                        
                        .ant-table-thead .ant-checkbox-wrapper .ant-checkbox-inner {
                            border-color: #6366f1 !important;
                            border-width: 2px !important;
                        }
                        
                        .ant-table-thead .ant-checkbox-wrapper .ant-checkbox-checked .ant-checkbox-inner {
                            background-color: #6366f1 !important;
                            border-color: #6366f1 !important;
                        }
                        
                        /* 防止表格内容换行，支持动态宽度 */
                        .ant-table-tbody td {
                            white-space: nowrap !important;
                            overflow: hidden !important;
                            text-overflow: ellipsis !important;
                        }
                        
                        /* 表格容器允许横向滚动 */
                        .ant-table-wrapper {
                            overflow-x: auto !important;
                        }
                        
                        /* 确保表格可以根据内容自动调整宽度 */
                        .ant-table-table {
                            width: auto !important;
                            min-width: 100% !important;
                        }
                    `}</style>
                    <Table.Column
                        dataIndex="name"
                        title={t('acmeAccountPage.name')}
                        width={120}
                        ellipsis={{
                            showTitle: false,
                        }}
                        render={(_, record: BaseRecord) => (
                            <a
                                style={{ color: "#1677ff", cursor: "pointer" }}
                                title={record.name || ''}
                                onClick={() => {
                                    if (record.id !== undefined && record.id !== null) {
                                        go({
                                            to: {
                                                resource: "acme/accounts",
                                                action: "show",
                                                id: record.id,
                                            }
                                        });
                                    }
                                }}
                            >
                                {record.name}
                            </a>
                        )}
                    />

                    <Table.Column
                        dataIndex={["created_at"]}
                        title={t('acmeAccountPage.createdAt')}
                        width={180}
                        render={(value: any) =>
                            value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-"
                        }
                    />

                    <Table.Column 
                        dataIndex="key_type" 
                        title={t('acmeAccountPage.keyType')} 
                        width={150}
                        ellipsis={{
                            showTitle: false,
                        }}
                        render={(text: string) => (
                            <div title={text || ''}>
                                {text || '-'}
                            </div>
                        )}
                    />
                    <Table.Column 
                        dataIndex="server" 
                        title={t('acmeAccountPage.acmeServer')}
                        width={200}
                        ellipsis={{
                            showTitle: false,
                        }}
                        render={(text: string) => (
                            <div title={text || ''}>
                                {text || '-'}
                            </div>
                        )}
                    />
                    <Table.Column
                        dataIndex={["email"]}
                        title={t('acmeAccountPage.email')}
                        width={200}
                        ellipsis={{
                            showTitle: false,
                        }}
                        render={(value: any) => (
                            <div title={value || ''}>
                                <EmailField value={value}/>
                            </div>
                        )}
                    />
                    <Table.Column
                        dataIndex="status"
                        title={t('acmeAccountPage.status')}
                        width={100}
                        render={(value: string) => (
                            <Tag color={(statusMap as Record<string, any>)[value]?.color || "default"}>
                                {(statusMap as Record<string, any>)[value]?.label || value}
                            </Tag>
                        )}
                    />

                    <Table.Column 
                        dataIndex="eab_key_id"
                        title={t('acmeAccountPage.bindEAB')}
                        width={100}
                        render={(value: string) => (
                            value && value.length > 0 ? (
                                <Tag color="green">{t('acmeAccountPage.yesOption')}</Tag>
                            ) : (
                                <Tag color="default">{t('acmeAccountPage.noOption')}</Tag>
                            )
                        )}
                    />
                    <Table.Column
                        title={t('acmeAccountPage.actions')}
                        dataIndex="actions"
                        width={160}
                        render={(_, record: BaseRecord) => (
                            <Space>
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => {
                                        if (record.id !== undefined && record.id !== null) {
                                            go({
                                                to: {
                                                    resource: "acme/accounts",
                                                    action: "edit",
                                                    id: record.id,
                                                },
                                            });
                                        }
                                    }}
                                    style={{ 
                                        padding: 0,
                                        height: 'auto',
                                        color: '#1677ff'
                                    }}
                                >
                                    {t('acmeAccountPage.edit')}
                                </Button>
                                <EditButton hideText size="small" recordItemId={record.id} style={{ display: 'none' }} />
                                <ShowButton hideText size="small" recordItemId={record.id} style={{ display: 'none' }} />
                                <Popconfirm
                                    title={t('acmeAccountPage.deactivateAccount')}
                                    description={t('acmeAccountPage.confirmDeactivate')}
                                    onConfirm={async () => {
                                        if (record.id) {
                                            try {
                                                await mutateAsync({
                                                    url: `${API_BASE_URL}/acme/accounts/${record.id}/deactivate`,
                                                    method: "post",
                                                    values: {},
                                                });
                                                message.success(t('acmeAccountPage.deactivateSuccess'));
                                                tableQueryResult.refetch();
                                            } catch (error) {
                                                message.error(t('acmeAccountPage.deactivateFailed') + (error as any).message);
                                            }
                                        }
                                    }}
                                    okText={t('acmeAccountPage.yesOption')}
                                    cancelText={t('acmeAccountPage.noOption')}
                                >
                                    <Button size="small" danger>
                                        {t('acmeAccountPage.deactivate')}
                                    </Button>
                                </Popconfirm>
                                <DeleteButton size="small" recordItemId={record.id}>
                                    {t('acmeAccountPage.delete')}
                                </DeleteButton>
                            </Space>
                        )}
                    />
                </Table>

            </List>
        </ConfigProvider>
    );
};
