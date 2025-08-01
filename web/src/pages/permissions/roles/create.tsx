import React, { useState } from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Checkbox, Card, Typography, Row, Col, message, ConfigProvider, Table } from "antd";
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import zhCN from 'antd/locale/zh_CN';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;
const { TextArea } = Input;

// Data structure for permissions, now using i18n
const getActionMap = (t: any): { [key: string]: string } => ({
    "stats": t('rolePage.viewStats'),
    "create": t('rolePage.create'),
    "read": t('rolePage.read'),
    "delete": t('rolePage.delete'),
    "manage": t('rolePage.manage'),
    "auth": t('rolePage.auth'),
    "update": t('rolePage.update'),
    "read_key": t('rolePage.readKey'),
    "read_secret": t('rolePage.readSecret'),
});

const createPermissionTree = (t: any) => [
    {
        name: t('rolePage.modules.dashboard'), key: 'dashboard', features: [
            { name: t('rolePage.features.dashboard'), key: 'dashboard:stats', permissions: [{ value: 'dashboard:stats', action: 'stats' }] }
        ]
    },
    {
        name: t('rolePage.modules.acme'), key: 'acme', features: [
            { name: t('rolePage.features.account'), key: 'acme:account', permissions: [
                { value: 'acme:account:create', action: 'create' }, { value: 'acme:account:read', action: 'read' },
                { value: 'acme:account:delete', action: 'delete' }, { value: 'acme:account:manage', action: 'manage' }
            ]},
            { name: t('rolePage.features.cert'), key: 'acme:cert', permissions: [
                { value: 'acme:cert:create', action: 'create' }, { value: 'acme:cert:read', action: 'read' },
                { value: 'acme:cert:delete', action: 'delete' }, { value: 'acme:cert:auth', action: 'auth' },
                { value: 'acme:cert:manage', action: 'manage' },
                { value: 'acme:cert:private_key:read', action: 'read_key' }
            ]}
        ]
    },
    {
        name: t('rolePage.modules.dns'), key: 'dns', features: [
            { name: t('rolePage.features.provider'), key: 'dns:provider', permissions: [
                { value: 'dns:provider:create', action: 'create' }, { value: 'dns:provider:read', action: 'read' },
                { value: 'dns:provider:update', action: 'update' }, { value: 'dns:provider:delete', action: 'delete' },
                { value: 'dns:provider:secret:read', action: 'read_secret' },
            ]}
        ]
    },
    {
        name: t('rolePage.modules.userRole'), key: 'user-role', features: [
            { name: t('rolePage.features.user'), key: 'user', permissions: [
                { value: 'user:create', action: 'create' }, { value: 'user:read', action: 'read' },
                { value: 'user:update', action: 'update' }, { value: 'user:delete', action: 'delete' }
            ]},
            { name: t('rolePage.features.role'), key: 'role', permissions: [
                { value: 'role:create', action: 'create' }, { value: 'role:read', action: 'read' },
                { value: 'role:update', action: 'update' }, { value: 'role:delete', action: 'delete' }
            ]}
        ]
    },
    {
        name: t('rolePage.modules.system'), key: 'system', features: [
            { name: t('rolePage.features.permission'), key: 'system:permission', permissions: [ { value: 'system:permission:read', action: 'read' }]
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
    const { t } = useTranslation();
    const { formProps, saveButtonProps } = useForm({
        onMutationSuccess: () => { message.success(t('rolePage.createSuccess')); },
        onMutationError: () => { message.error(t('rolePage.createFailed')); },
    });

    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const handleSelectionChange = (permsToAdd: string[], permsToRemove: string[]) => {
        const newSelected = [...new Set([...selectedPermissions.filter(p => !permsToRemove.includes(p)), ...permsToAdd])];
        setSelectedPermissions(newSelected);
        formProps.form?.setFieldsValue({ permissions: newSelected });
    };

    // 使用函数创建permissionTree，这样可以获取最新的翻译
    const permissionTree = createPermissionTree(t);

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
            title: t('rolePage.module'),
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
            title: t('rolePage.permissionOperation'),
            dataIndex: 'feature',
            width: '80%',
            render: (feature: { name: string; permissions: { value: string; action: string }[] }) => {
                const featurePerms = feature.permissions.map(p => p.value);
                const selectedInFeature = featurePerms.filter(p => selectedPermissions.includes(p));
                const isFeatureChecked = selectedInFeature.length > 0 && selectedInFeature.length === featurePerms.length;
                const isFeatureIndeterminate = selectedInFeature.length > 0 && selectedInFeature.length < featurePerms.length;

                const actionMap = getActionMap(t);
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
                            <Card title={t('rolePage.basicInfo')} style={{ marginBottom: 24 }}>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label={t('rolePage.name')} name="name" rules={[{ required: true, message: t('rolePage.nameRequired') }]}>
                                            <Input placeholder={t('rolePage.enterName')} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label={t('rolePage.description')} name="description">
                                            <TextArea placeholder={t('rolePage.enterDescription')} rows={1} autoSize={{ minRows: 1, maxRows: 3 }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                        <Col span={24}>
                            <Card title={t('rolePage.permissionConfig')}>
                                <Form.Item name="permissions" rules={[{ required: true, message: t('rolePage.permissionRequired') }]}>
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
