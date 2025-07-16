import React, { useState } from "react";
import { BaseRecord, useDeleteMany, useGo } from "@refinedev/core";
import {
    useTable,
    List,
    EditButton,
    DeleteButton,
} from "@refinedev/antd";
import { Table, Space, Button, Popconfirm, message, Card, Typography, Tag, Select, Row, Col, Form, ConfigProvider, theme, Input } from "antd";
import { DeleteOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";

const { Text } = Typography;

export const DNSList = () => {
    const [localFilters, setLocalFilters] = useState<any[]>([]);
    
    const { tableProps, tableQueryResult, filters, setFilters } = useTable({
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

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [selectedRows, setSelectedRows] = useState<BaseRecord[]>([]);
    const { mutate: deleteMany } = useDeleteMany();

    const handleBatchDelete = () => {
        deleteMany(
            {
                resource: "dns/provider",
                ids: selectedRowKeys as string[],
            },
            {
                onSuccess: () => {
                    message.success("批量删除成功");
                    setSelectedRowKeys([]);
                    setSelectedRows([]);
                    tableQueryResult.refetch();
                },
                onError: () => {
                    message.error("批量删除失败");
                },
            }
        );
    };



    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: BaseRecord[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
            setSelectedRows(newSelectedRows);
        },
        columnWidth: 60,
    };

    // 获取厂商类型显示名称
    const getProviderTypeName = (type: string) => {
        const typeMap: { [key: string]: { name: string; color: string } } = {
            'tencentcloud': { name: '腾讯云', color: 'blue' },
            'aliyun': { name: '阿里云', color: 'orange' },
            'huaweicloud': { name: '华为云', color: 'red' },
            'baiducloud': { name: '百度云', color: 'purple' },
            'cloudflare': { name: 'Cloudflare', color: 'geekblue' },
            'godaddy': { name: 'GoDaddy', color: 'green' },
        };
        return typeMap[type] || { name: type || '未知', color: 'default' };
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

    // 渲染授权信息
    const renderCredential = (record: BaseRecord, field: 'secret_id' | 'secret_key') => {
        const keys = getCredentialKeys(record.type);
        const keyName = field === 'secret_id' ? keys.idKey : keys.keyKey;
        const value = record[field];
        
        if (!value) return '-';

        return (
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                <span style={{ color: '#666', fontWeight: 'bold' }}>{keyName}:</span>
                <span style={{ color: '#333', marginLeft: '4px' }}>{value}</span>
            </div>
        );
    };

    // 厂商类型选项
    const providerTypeOptions = [
        { label: <Tag color="blue">腾讯云</Tag>, value: 'tencentcloud' },
        { label: <Tag color="orange">阿里云</Tag>, value: 'aliyun' },
        { label: <Tag color="red">华为云</Tag>, value: 'huaweicloud' },
        { label: <Tag color="purple">百度云</Tag>, value: 'baiducloud' },
        { label: <Tag color="geekblue">Cloudflare</Tag>, value: 'cloudflare' },
        { label: <Tag color="green">GoDaddy</Tag>, value: 'godaddy' },
    ];

    // 处理厂商类型筛选
    const handleTypeFilter = (value: string | undefined) => {
        const nameFilter = localFilters.find((f: any) => f.field === "name");
        const newFilters = [];
        
        if (value && value.trim()) {
            newFilters.push({
                field: "type",
                operator: "eq",
                value: value,
            } as any);
        }
        
        if (nameFilter && nameFilter.value && nameFilter.value.trim()) {
            newFilters.push(nameFilter);
        }
        
        setLocalFilters(newFilters);
    };

    // 处理名称搜索
    const handleNameSearch = (value: string) => {
        const typeFilter = localFilters.find((f: any) => f.field === "type");
        const newFilters = [];
        
        if (value && value.trim()) {
            newFilters.push({
                field: "name",
                operator: "contains",
                value: value,
            } as any);
        }
        
        if (typeFilter && typeFilter.value && typeFilter.value.trim()) {
            newFilters.push(typeFilter);
        }
        
        setLocalFilters(newFilters);
    };

    // 获取当前筛选的厂商类型
    const getCurrentTypeFilter = () => {
        const typeFilter = localFilters.find((f: any) => f.field === "type");
        return typeFilter?.value || undefined;
    };

    // 获取当前筛选的名称
    const getCurrentNameFilter = () => {
        const nameFilter = localFilters.find((f: any) => f.field === "name");
        return nameFilter?.value || "";
    };

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
                {/* 筛选条件栏 - 参考证书列表样式 */}
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
                                label={<span style={{ fontWeight: 500, color: '#595959' }}>名称</span>}
                                style={{ marginBottom: 0 }}
                            >
                                <Input.Search
                                    style={{ width: 200 }}
                                    placeholder="输入名称搜索"
                                    value={getCurrentNameFilter()}
                                    onChange={(e) => handleNameSearch(e.target.value)}
                                    onSearch={handleNameSearch}
                                    allowClear
                                />
                            </Form.Item>
                            <Form.Item
                                label={<span style={{ fontWeight: 500, color: '#595959' }}>厂商类型</span>}
                                style={{ marginBottom: 0 }}
                            >
                                <Select
                                    style={{ width: 140 }}
                                    placeholder="选择厂商类型"
                                    value={getCurrentTypeFilter()}
                                    onChange={handleTypeFilter}
                                    options={providerTypeOptions}
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
                                onClick={() => go({ to: { resource: "dns/provider", action: "create" } })}
                            >
                                新建
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
                                title="批量删除"
                                description={`确定要删除选中的 ${selectedRowKeys.length} 个DNS提供商吗？此操作不可恢复。`}
                                onConfirm={handleBatchDelete}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button size="small" danger icon={<DeleteOutlined />}>
                                    批量删除
                                </Button>
                            </Popconfirm>
                            <Button 
                                size="small" 
                                onClick={() => {
                                    setSelectedRowKeys([]);
                                    setSelectedRows([]);
                                }}
                            >
                                取消选择
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
                        title="名称"
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
                                                resource: "dns/provider",
                                                action: "show",
                                                id: record.id,
                                            },
                                        });
                                    }
                                }}
                            >
                                {record.name}
                            </a>
                        )}
                    />
                    <Table.Column
                        dataIndex="type"
                        title="厂商类型"
                        width={120}
                        render={(type: string) => {
                            const typeInfo = getProviderTypeName(type);
                            return <Tag color={typeInfo.color}>{typeInfo.name}</Tag>;
                        }}
                    />
                    <Table.Column
                        dataIndex={["created_at"]}
                        title="创建时间"
                        width={180}
                        render={(value: any) =>
                            value ? dayjs(value).format("YYYY-MM-DD HH:mm:ss") : "-"
                        }
                    />
                    <Table.Column
                        dataIndex="secret_id"
                        title="授权ID"
                        width={300}
                        ellipsis={{
                            showTitle: false,
                        }}
                        render={(_, record: BaseRecord) => (
                            <div title={`${getCredentialKeys(record.type).idKey}: ${record.secret_id || ''}`}>
                                {renderCredential(record, 'secret_id')}
                            </div>
                        )}
                    />
                    <Table.Column 
                        dataIndex="notes" 
                        title="备注" 
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
                        title="操作"
                        dataIndex="actions"
                        width={120}
                        render={(_, record: BaseRecord) => (
                            <Space>
                                <Button
                                    type="link"
                                    size="small"
                                    onClick={() => {
                                        if (record.id !== undefined && record.id !== null) {
                                            go({
                                                to: {
                                                    resource: "dns/provider",
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
                                    编辑
                                </Button>
                                <EditButton hideText size="small" recordItemId={record.id} style={{ display: 'none' }} />
                                <DeleteButton size="small" recordItemId={record.id}>
                                    删除
                                </DeleteButton>
                            </Space>
                        )}
                    />
                </Table>

            </List>
        </ConfigProvider>
    );
};
