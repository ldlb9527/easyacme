import React, { useState } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Checkbox, Card, Typography, Row, Col, message, ConfigProvider, Table } from "antd";
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import zhCN from 'antd/locale/zh_CN';

const { Text } = Typography;
const { TextArea } = Input;

const actionMap: { [key: string]: string } = {
    "stats": "查看统计",
    "create": "创建",
    "read": "查看",
    "delete": "删除",
    "manage": "管理",
    "auth": "验证",
    "update": "编辑",
    "read_key": "查看私钥",
    "read_secret": "查看密钥",
};

const permissionTree = [
    {
        name: '看板', key: 'dashboard', features: [
            { name: '统计', key: 'dashboard:stats', permissions: [{ value: 'dashboard:stats', action: 'stats' }] }
        ]
    },
    {
        name: 'ACME 管理', key: 'acme', features: [
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
        ]
    },
    {
        name: 'DNS 提供商', key: 'dns', features: [
            { name: '提供商管理', key: 'dns:provider', permissions: [
                { value: 'dns:provider:create', action: 'create' }, { value: 'dns:provider:read', action: 'read' },
                { value: 'dns:provider:update', action: 'update' }, { value: 'dns:provider:delete', action: 'delete' },
                { value: 'dns:provider:secret:read', action: 'read_secret' },
            ]}
        ]
    },
    {
        name: '用户与角色', key: 'user-role', features: [
            { name: '用户管理', key: 'user', permissions: [
                { value: 'user:create', action: 'create' }, { value: 'user:read', action: 'read' },
                { value: 'user:update', action: 'update' }, { value: 'user:delete', action: 'delete' }
            ]},
            { name: '角色管理', key: 'role', permissions: [
                { value: 'role:create', action: 'create' }, { value: 'role:read', action: 'read' },
                { value: 'role:update', action: 'update' }, { value: 'role:delete', action: 'delete' }
            ]}
        ]
    },
    {
        name: '系统', key: 'system', features: [
            { name: '系统权限', key: 'system:permission', permissions: [ { value: 'system:permission:read', action: 'read' }]
            }
        ]
    }
];

interface TableRecord {
    key: string;
    moduleName: string;
    moduleKey: string;
    feature: {
        name: string;
        key: string;
        permissions: { value: string; action: string }[];
    };
    rowSpan: number;
}


export const RoleCreate = () => {
    const { formProps, saveButtonProps } = useForm({
        onMutationSuccess: () => { message.success("角色创建成功"); },
        onMutationError: () => { message.error("角色创建失败"); },
    });

    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const handleSelectionChange = (permsToAdd: string[], permsToRemove: string[]) => {
        const newSelected = [...new Set([...selectedPermissions.filter(p => !permsToRemove.includes(p)), ...permsToAdd])];
        setSelectedPermissions(newSelected);
        formProps.form?.setFieldsValue({ permissions: newSelected });
    };

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
            title: '功能模块',
            dataIndex: 'moduleName',
            width: '20%',
            onCell: (record: TableRecord) => ({ rowSpan: record.rowSpan }),
            render: (value: string, record: TableRecord) => {
                const module = permissionTree.find(m => m.key === record.moduleKey);
                if (!module) return null;
                const modulePerms = module.features.flatMap(f => f.permissions.map(p => p.value));
                const selectedInModule = modulePerms.filter(p => selectedPermissions.includes(p));
                const isChecked = selectedInModule.length > 0 && selectedInModule.length === modulePerms.length;
                const isIndeterminate = selectedInModule.length > 0 && selectedInModule.length < modulePerms.length;
                
                return (
                    <Checkbox
                        checked={isChecked}
                        indeterminate={isIndeterminate}
                        onChange={(e: CheckboxChangeEvent) => handleSelectionChange(e.target.checked ? modulePerms : [], modulePerms)}
                    >
                        <Text strong>{value}</Text>
                    </Checkbox>
                );
            },
        },
        {
            title: '权限操作',
            dataIndex: 'feature',
            width: '80%',
            render: (feature: { name: string; permissions: { value: string; action: string }[] }) => {
                const featurePerms = feature.permissions.map(p => p.value);
                const selectedInFeature = featurePerms.filter(p => selectedPermissions.includes(p));
                const isFeatureChecked = selectedInFeature.length > 0 && selectedInFeature.length === featurePerms.length;
                const isFeatureIndeterminate = selectedInFeature.length > 0 && selectedInFeature.length < featurePerms.length;

                const actionOptions = feature.permissions.map(p => ({ label: actionMap[p.action] || p.action, value: p.value }));

                return (
                    <Row align="middle">
                        <Col span={6}>
                             <Checkbox
                                checked={isFeatureChecked}
                                indeterminate={isFeatureIndeterminate}
                                onChange={(e: CheckboxChangeEvent) => handleSelectionChange(e.target.checked ? featurePerms : [], featurePerms)}
                             >
                                {feature.name}
                            </Checkbox>
                        </Col>
                        <Col span={18}>
                            <Checkbox.Group
                                options={actionOptions}
                                value={selectedPermissions}
                                onChange={(values) => {
                                    const allActionValues = featurePerms;
                                    const currentSelectionInGroup = allActionValues.filter(v => (values as string[]).includes(v));
                                    const removed = allActionValues.filter(v => !currentSelectionInGroup.includes(v));
                                    handleSelectionChange(currentSelectionInGroup, removed);
                                }}
                            />
                        </Col>
                    </Row>
                );
            },
        },
    ];

    return (
        <ConfigProvider locale={zhCN}>
            <Create saveButtonProps={saveButtonProps}>
                <Form {...formProps} layout="vertical">
                    <Row gutter={24}>
                        <Col span={24}>
                            <Card title="基本信息" style={{ marginBottom: 24 }}>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="角色名称" name="name" rules={[{ required: true, message: "请输入角色名称" }]}>
                                            <Input placeholder="请输入角色名称" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="角色描述" name="description">
                                            <TextArea placeholder="请输入角色描述（可选）" rows={1} autoSize={{ minRows: 1, maxRows: 3 }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                        <Col span={24}>
                            <Card title="权限配置">
                                <Form.Item name="permissions" rules={[{ required: true, message: "请至少选择一个权限" }]}>
                                   {/* The Checkbox.Group is controlled by the Table now, but Form.Item needs a child. */}
                                   <div style={{ display: 'none' }} />
                                </Form.Item>
                                <div style={{ overflowX: 'auto' }}>
                                    <Table
                                        columns={columns}
                                        dataSource={tableData}
                                        pagination={false}
                                        size="small"
                                    />
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </Create>
        </ConfigProvider>
    );
};
