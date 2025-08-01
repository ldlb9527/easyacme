import React, { useState } from "react";
import { BaseRecord, useDeleteMany, useGo } from "@refinedev/core";
import {
    useTable,
    List,
    EditButton,
    ShowButton,
    DeleteButton,
} from "@refinedev/antd";
import { Table, Space, Button, Popconfirm, message, Card, Typography, ConfigProvider } from "antd";
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import zhCN from 'antd/locale/zh_CN';

const { Text } = Typography;
import dayjs from "dayjs";

export const RoleList = () => {
    const { tableProps, tableQueryResult } = useTable({
        syncWithLocation: true,
    });
    const go = useGo();
    const { t } = useTranslation();

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [selectedRows, setSelectedRows] = useState<BaseRecord[]>([]);
    const { mutate: deleteMany } = useDeleteMany();

    const handleBatchDelete = () => {
        deleteMany(
            {
                resource: "account/roles",
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
    };

    return (
        <ConfigProvider locale={zhCN}>
            <List
                headerButtons={({ defaultButtons }) => (
                    <>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                go({
                                    to: {
                                        resource: "account/roles",
                                        action: "create",
                                    },
                                });
                            }}
                            style={{
                                borderRadius: '6px',
                                fontWeight: 500,
                            }}
                        >
                            {t('rolePage.createRole')}
                        </Button>
                    </>
                )}
            >
            {/* 批量操作栏 */}
            {selectedRowKeys.length > 0 && (
                <Card 
                    size="small" 
                    style={{ 
                        marginBottom: 16, 
                        background: '#fafafa',
                        border: '1px solid #e8e8e8',
                        borderRadius: '6px',
                    }}
                    bodyStyle={{ padding: '12px 16px' }}
                >
                    <Space>
                        <Text style={{ color: '#666', fontSize: '14px' }}>
                            {t('rolePage.selected')} <Text strong>{selectedRowKeys.length}</Text> {t('rolePage.items')}
                        </Text>
                        <Popconfirm
                            title={t('rolePage.batchDelete')}
                            description={t('rolePage.confirmBatchDelete', { count: selectedRowKeys.length })}
                            onConfirm={handleBatchDelete}
                            okText={t('rolePage.confirm')}
                            cancelText={t('rolePage.cancel')}
                        >
                            <Button 
                                size="small" 
                                danger 
                                icon={<DeleteOutlined />}
                                style={{ borderRadius: '4px' }}
                            >
                                {t('rolePage.batchDelete')}
                            </Button>
                        </Popconfirm>
                        <Button 
                            size="small" 
                            onClick={() => {
                                setSelectedRowKeys([]);
                                setSelectedRows([]);
                            }}
                            style={{ borderRadius: '4px' }}
                        >
                            {t('rolePage.cancelSelection')}
                        </Button>
                    </Space>
                </Card>
            )}
            
            <Table
                {...tableProps}
                rowKey="id"
                rowSelection={rowSelection}
                size="middle"
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}
                pagination={{
                    ...tableProps.pagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    style: { marginTop: '16px' }
                }}
            >
                <Table.Column
                    dataIndex="name"
                    title={t('rolePage.name')}
                    render={(_, record: BaseRecord) => (
                        <a
                            style={{ 
                                cursor: "pointer",
                                fontWeight: 500,
                            }}
                            onClick={() => {
                                if (record.id !== undefined && record.id !== null) {
                                    go({
                                        to: {
                                            resource: "account/roles",
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
                    dataIndex="description" 
                    title={t('rolePage.description')} 
                    render={(value: string) => (
                        <Text style={{ fontSize: '13px', color: '#666' }}>
                            {value || '-'}
                        </Text>
                    )}
                />
                <Table.Column
                    dataIndex={["created_at"]}
                    title={t('rolePage.createdAt')}
                    render={(value: any) =>
                        value ? (
                            <Text style={{ fontSize: '13px', color: '#666' }}>
                                {dayjs(value).format("YYYY-MM-DD HH:mm:ss")}
                            </Text>
                        ) : "-"
                    }
                />
                <Table.Column
                    title={t('rolePage.actions')}
                    dataIndex="actions"
                    width={120}
                    render={(_, record: BaseRecord) => (
                        <Space size="small">
                            <EditButton 
                                hideText 
                                size="small" 
                                recordItemId={record.id}
                                style={{ 
                                    border: 'none',
                                    boxShadow: 'none',
                                }}
                            />
                            <ShowButton 
                                hideText 
                                size="small" 
                                recordItemId={record.id}
                                style={{ 
                                    border: 'none',
                                    boxShadow: 'none',
                                }}
                            />
                            <DeleteButton 
                                hideText 
                                size="small" 
                                recordItemId={record.id}
                                style={{ 
                                    border: 'none',
                                    boxShadow: 'none',
                                }}
                            />
                        </Space>
                    )}
                />
            </Table>
        </List>
    </ConfigProvider>
        );
};
