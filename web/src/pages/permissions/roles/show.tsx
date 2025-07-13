import React, { useState, useEffect } from "react";
import { useShow } from "@refinedev/core";
import { Show } from "@refinedev/antd";
import { Checkbox, Card, Typography, Row, Col, ConfigProvider, Table, Descriptions } from "antd";
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";

const { Text } = Typography;

// Data structure for permissions (same as in create.tsx)
const actionMap: { [key: string]: string } = {
    "stats": "查看统计", "create": "创建", "read": "查看", "delete": "删除",
    "manage": "管理", "auth": "验证", "update": "编辑", "read_key": "查看私钥",
    "read_secret": "查看密钥",
};

const permissionTree = [
    { name: '看板', key: 'dashboard', features: [{ name: '统计', key: 'dashboard:stats', permissions: [{ value: 'dashboard:stats', action: 'stats' }] }] },
    { name: 'ACME 管理', key: 'acme', features: [
        { name: '账户管理', key: 'acme:account', permissions: [
            { value: 'acme:account:create', action: 'create' }, { value: 'acme:account:read', action: 'read' },
            { value: 'acme:account:delete', action: 'delete' }, { value: 'acme:account:manage', action: 'manage' }
        ]},
        { name: '证书管理', key: 'acme:cert', permissions: [
            { value: 'acme:cert:create', action: 'create' }, { value: 'acme:cert:read', action: 'read' },
            { value: 'acme:cert:delete', action: 'delete' }, { value: 'acme:cert:auth', action: 'auth' },
            { value: 'acme:cert:manage', action: 'manage' },
            { value: 'acme:cert:private_key:read', action: 'read_key' }
        ]}
    ]},
    { name: 'DNS 提供商', key: 'dns', features: [
        { name: '提供商管理', key: 'dns:provider', permissions: [
            { value: 'dns:provider:create', action: 'create' }, { value: 'dns:provider:read', action: 'read' },
            { value: 'dns:provider:update', action: 'update' }, { value: 'dns:provider:delete', action: 'delete' },
            { value: 'dns:provider:secret:read', action: 'read_secret' },
        ]}
    ]},
    { name: '用户与角色', key: 'user-role', features: [
        { name: '用户管理', key: 'user', permissions: [
            { value: 'user:create', action: 'create' }, { value: 'user:read', action: 'read' },
            { value: 'user:update', action: 'update' }, { value: 'user:delete', action: 'delete' }
        ]},
        { name: '角色管理', key: 'role', permissions: [
            { value: 'role:create', action: 'create' }, { value: 'role:read', action: 'read' },
            { value: 'role:update', action: 'update' }, { value: 'role:delete', action: 'delete' }
        ]}
    ]},
    { name: '系统', key: 'system', features: [
        { name: '系统权限', key: 'system:permission', permissions: [ { value: 'system:permission:read', action: 'read' }] }
    ]}
];

interface TableRecord {
    key: string; moduleName: string; moduleKey: string;
    feature: { name: string; key: string; permissions: { value: string; action: string }[] };
    rowSpan: number;
}

export const RoleShow = () => {
    const { queryResult } = useShow();
    const record = queryResult?.data?.data;

    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    useEffect(() => {
        if (record?.permissions && Array.isArray(record.permissions)) {
            const perms = record.permissions.map((p: any) => p.permission);
            if (perms.includes('*')) {
                // If '*' is present, select all permissions
                const allPermissions = permissionTree.flatMap(module =>
                    module.features.flatMap(feature =>
                        feature.permissions.map(p => p.value)
                    )
                );
                setSelectedPermissions(allPermissions);
            } else {
                setSelectedPermissions(perms);
            }
        }
    }, [record]);

    const tableData: TableRecord[] = permissionTree.flatMap(module => 
        module.features.map((feature, featureIndex) => ({
            key: feature.key,
            moduleName: module.name,
            moduleKey: module.key,
            feature: feature,
            rowSpan: featureIndex === 0 ? module.features.length : 0,
        }))
    );

    const columns = [
        {
            title: '功能模块', dataIndex: 'moduleName', width: '20%',
            onCell: (record: TableRecord) => ({ rowSpan: record.rowSpan }),
            render: (value: string, record: TableRecord) => {
                const module = permissionTree.find(m => m.key === record.moduleKey);
                if (!module) return null;
                const modulePerms = module.features.flatMap(f => f.permissions.map(p => p.value));
                const selectedInModule = modulePerms.filter(p => selectedPermissions.includes(p));
                const isChecked = selectedInModule.length > 0 && selectedInModule.length === modulePerms.length;
                const isIndeterminate = selectedInModule.length > 0 && selectedInModule.length < modulePerms.length;
                return (
                    <div style={{ pointerEvents: 'none' }}>
                        <Checkbox checked={isChecked} indeterminate={isIndeterminate}>
                            <Text strong>{value}</Text>
                        </Checkbox>
                    </div>
                );
            },
        },
        {
            title: '权限操作', dataIndex: 'feature', width: '80%',
            render: (feature: { name: string; permissions: { value: string; action: string }[] }) => {
                const featurePerms = feature.permissions.map(p => p.value);
                const selectedInFeature = featurePerms.filter(p => selectedPermissions.includes(p));
                const isFeatureChecked = selectedInFeature.length > 0 && selectedInFeature.length === featurePerms.length;
                const isFeatureIndeterminate = selectedInFeature.length > 0 && selectedInFeature.length < featurePerms.length;
                const actionOptions = feature.permissions.map(p => ({ label: actionMap[p.action] || p.action, value: p.value }));
                return (
                    <Row align="middle">
                        <Col span={6}>
                            <div style={{ pointerEvents: 'none' }}>
                                <Checkbox checked={isFeatureChecked} indeterminate={isFeatureIndeterminate}>{feature.name}</Checkbox>
                            </div>
                        </Col>
                        <Col span={18}>
                            <div style={{ pointerEvents: 'none' }}>
                                <Checkbox.Group options={actionOptions} value={selectedPermissions} />
                            </div>
                        </Col>
                    </Row>
                );
            },
        },
    ];

    return (
        <ConfigProvider locale={zhCN}>
            <Show isLoading={queryResult.isLoading}>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Card title="基本信息" bordered={false}>
                            <Descriptions bordered column={2} size="small">
                                <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
                                <Descriptions.Item label="角色名称">{record?.name}</Descriptions.Item>
                                <Descriptions.Item label="创建时间">{dayjs(record?.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                                <Descriptions.Item label="更新时间">{dayjs(record?.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                                <Descriptions.Item label="描述" span={2}>{record?.description || "-"}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col span={24}>
                        <Card title="权限配置" bordered={false}>
                            <div style={{ overflowX: 'auto' }}>
                                <Table columns={columns} dataSource={tableData} pagination={false} size="small" />
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Show>
        </ConfigProvider>
    );
};