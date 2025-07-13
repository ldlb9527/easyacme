import React, { useState } from "react";
import { BaseRecord, useDeleteMany, useUpdate, useGo } from "@refinedev/core";
import {
    useTable,
    List,
    EditButton,
    ShowButton,
    DeleteButton,
    CreateButton,
} from "@refinedev/antd";
import { Table, Space, Button, Popconfirm, message, Card, Typography, Switch, Drawer } from "antd";
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { UserCreate } from "./create";

const { Text } = Typography;
import dayjs from "dayjs";

export const UserList = () => {
    const { tableProps, tableQueryResult } = useTable({
        syncWithLocation: true,
    });
    const go = useGo();

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [selectedRows, setSelectedRows] = useState<BaseRecord[]>([]);
    const [drawerVisible, setDrawerVisible] = useState(false);
    
    const { mutate: deleteMany } = useDeleteMany();
    const { mutate: updateUser } = useUpdate();

    const handleBatchDelete = () => {
        deleteMany(
            {
                resource: "account/users",
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

    const handleEnabledChange = (checked: boolean, record: BaseRecord) => {
        updateUser(
            {
                resource: "account/users",
                id: record.id,
                values: {
                    enabled: checked,
                },
                meta: {
                    method: "put",
                },
            },
            {
                onSuccess: () => {
                    message.success(checked ? "用户已启用" : "用户已禁用");
                },
                onError: () => {
                    message.error("状态更新失败");
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
        <>
            <List
                headerButtons={({ defaultButtons }) => (
                    <>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setDrawerVisible(true)}
                            style={{
                                borderRadius: '6px',
                                fontWeight: 500,
                            }}
                        >
                            新建用户
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
                                description={`确定要删除选中的 ${selectedRowKeys.length} 个用户吗？此操作不可恢复。`}
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
                        dataIndex={["username"]}
                        title="用户名"
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
                                                resource: "account/users",
                                                action: "show",
                                                id: record.id,
                                            },
                                        });
                                    }
                                }}
                            >
                                {record.username}
                            </a>
                        )}
                    />
                    <Table.Column
                        dataIndex={["enabled"]}
                        title="启用"
                        width={80}
                        render={(value: boolean, record: BaseRecord) => (
                            <Switch
                                checked={value}
                                onChange={(checked) => handleEnabledChange(checked, record)}
                                size="small"
                            />
                        )}
                    />
                    <Table.Column
                        dataIndex={["roles"]}
                        title="角色列表"
                        render={(roles: any[]) => (
                            <Space size={[4, 4]} wrap>
                                {roles && roles.length > 0 ? (
                                    roles.map((role: any) => (
                                        <span 
                                            key={role.id}
                                            style={{
                                                padding: '2px 8px',
                                                backgroundColor: '#f5f5f5',
                                                border: '1px solid #e8e8e8',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#666',
                                            }}
                                        >
                                            {role.role?.name}
                                        </span>
                                    ))
                                ) : (
                                    <Text type="secondary" style={{ fontSize: '12px', color: '#ccc' }}>-</Text>
                                )}
                            </Space>
                        )}
                    />
                    <Table.Column
                        dataIndex={["last_login_at"]}
                        title="上次登录时间"
                        render={(value: any) =>
                            value ? (
                                <Text style={{ fontSize: '13px', color: '#666' }}>
                                    {dayjs(value).format("YYYY-MM-DD HH:mm:ss")}
                                </Text>
                            ) : (
                                <Text type="secondary" style={{ fontSize: '12px', color: '#ccc' }}>-</Text>
                            )
                        }
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

            {/* 创建用户抽屉 */}
            <Drawer
                title="新建用户"
                placement="right"
                width={480}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{
                    header: {
                        borderBottom: '1px solid #e8e8e8',
                        padding: '16px 24px',
                    },
                    body: {
                        padding: '24px',
                    }
                }}
                destroyOnClose
            >
                <UserCreate 
                    onSuccess={() => {
                        setDrawerVisible(false);
                        tableQueryResult.refetch();
                    }}
                />
            </Drawer>
        </>
    );
};
