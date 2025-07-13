import React, { useState } from "react";
import { BaseRecord, useDeleteMany, useGo } from "@refinedev/core";
import {
    useTable,
    List,
    EditButton,
    ShowButton,
    DeleteButton,
} from "@refinedev/antd";
import { Table, Space, Button, Popconfirm, message, Card, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;
import dayjs from "dayjs";

export const RoleList = () => {
    const { tableProps, tableQueryResult } = useTable({
        syncWithLocation: true,
    });
    const go = useGo();

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
                        新建角色
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
                            已选择 <Text strong>{selectedRowKeys.length}</Text> 项
                        </Text>
                        <Popconfirm
                            title="批量删除"
                            description={`确定要删除选中的 ${selectedRowKeys.length} 个角色吗？此操作不可恢复。`}
                            onConfirm={handleBatchDelete}
                            okText="确定"
                            cancelText="取消"
                        >
                            <Button 
                                size="small" 
                                danger 
                                icon={<DeleteOutlined />}
                                style={{ borderRadius: '4px' }}
                            >
                                批量删除
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
                    title="名称"
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
                    title="描述" 
                    render={(value: string) => (
                        <Text style={{ fontSize: '13px', color: '#666' }}>
                            {value || '-'}
                        </Text>
                    )}
                />
                <Table.Column
                    dataIndex={["created_at"]}
                    title="创建时间"
                    render={(value: any) =>
                        value ? (
                            <Text style={{ fontSize: '13px', color: '#666' }}>
                                {dayjs(value).format("YYYY-MM-DD HH:mm:ss")}
                            </Text>
                        ) : "-"
                    }
                />
                <Table.Column
                    title="操作"
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
    );
};
