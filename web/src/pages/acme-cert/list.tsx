import React, { useState } from "react";
import { BaseRecord, useGo, useCustomMutation, useCan } from "@refinedev/core";
import {
    useTable,
    List,
    DeleteButton,
    TagField,
} from "@refinedev/antd";
import { Table, Space, Tag, Button, Popconfirm, message, Input, Select, Form, Card, ConfigProvider, theme } from "antd";
import zhCN from 'antd/locale/zh_CN';
import { CertApply } from "./create";
import { API_BASE_URL } from '../../config';
import { ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from 'react-i18next';
import { getStatusMap } from "./status";

export const CertList = () => {
    const [localFilters, setLocalFilters] = useState<any[]>([]);
    
    const { tableProps, tableQueryResult } = useTable({
        resource: "acme/certificates",
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

    const { data: canAccessPrivateKey } = useCan({
        resource: "acme/certificates",
        action: "private_key_read",
    });


    // 证书类型选项
    const certTypeOptions = [
        { 
            label: <Tag color="blue">{t('acmeCertPage.typeDV')}</Tag>, 
            value: "DV" 
        },
        { 
            label: <Tag color="purple">{t('acmeCertPage.typeOV')}</Tag>, 
            value: "OV" 
        },
        { 
            label: <Tag color="gold">{t('acmeCertPage.typeEV')}</Tag>, 
            value: "EV" 
        },
    ];

    // 状态选项
    const statusOptions = Object.entries(statusMap).map(([key, value]) => ({
        label: <Tag color={value.color}>{value.label}</Tag>,
        value: key,
    }));

    // 处理域名搜索
    const handleDomainSearch = (value: string) => {
        const typeFilter = localFilters.find((f: any) => f.field === "cert_type");
        const statusFilter = localFilters.find((f: any) => f.field === "cert_status");
        const newFilters = [];
        
        if (value && value.trim()) {
            newFilters.push({
                field: "domains",
                operator: "contains",
                value: value,
            } as any);
        }
        
        if (typeFilter && typeFilter.value && typeFilter.value.trim()) {
            newFilters.push(typeFilter);
        }
        
        if (statusFilter && statusFilter.value && statusFilter.value.trim()) {
            newFilters.push(statusFilter);
        }
        
        setLocalFilters(newFilters);
    };

    // 处理证书类型筛选
    const handleTypeFilter = (value: string | undefined) => {
        const domainFilter = localFilters.find((f: any) => f.field === "domains");
        const statusFilter = localFilters.find((f: any) => f.field === "cert_status");
        const newFilters = [];
        
        if (value && value.trim()) {
            newFilters.push({
                field: "cert_type",
                operator: "eq",
                value: value,
            } as any);
        }
        
        if (domainFilter && domainFilter.value && domainFilter.value.trim()) {
            newFilters.push(domainFilter);
        }
        
        if (statusFilter && statusFilter.value && statusFilter.value.trim()) {
            newFilters.push(statusFilter);
        }
        
        setLocalFilters(newFilters);
    };

    // 处理状态筛选
    const handleStatusFilter = (value: string | undefined) => {
        const domainFilter = localFilters.find((f: any) => f.field === "domains");
        const typeFilter = localFilters.find((f: any) => f.field === "cert_type");
        const newFilters = [];
        
        if (value && value.trim()) {
            newFilters.push({
                field: "cert_status",
                operator: "eq",
                value: value,
            } as any);
        }
        
        if (domainFilter && domainFilter.value && domainFilter.value.trim()) {
            newFilters.push(domainFilter);
        }
        
        if (typeFilter && typeFilter.value && typeFilter.value.trim()) {
            newFilters.push(typeFilter);
        }
        
        setLocalFilters(newFilters);
    };

    // 获取当前筛选值
    const getCurrentDomainFilter = () => {
        const domainFilter = localFilters.find((f: any) => f.field === "domains");
        return domainFilter?.value || "";
    };

    const getCurrentTypeFilter = () => {
        const typeFilter = localFilters.find((f: any) => f.field === "cert_type");
        return typeFilter?.value || undefined;
    };

    const getCurrentStatusFilter = () => {
        const statusFilter = localFilters.find((f: any) => f.field === "cert_status");
        return statusFilter?.value || undefined;
    };

    // 清除筛选
    const handleClearFilters = () => {
        setLocalFilters([]);
    };

    // 获取状态颜色
    const getStatusColor = (status: string) => {
        return (statusMap as Record<string, any>)[status]?.color || 'default';
    };

    // 获取状态显示文本
    const getStatusText = (status: string) => {
        return (statusMap as Record<string, any>)[status]?.label || status;
    };

    // 计算剩余有效期
    const calculateRemainingDays = (issuedAt: string | null, validityDays: number) => {
        if (!issuedAt || !validityDays) {
            return '-';
        }
        
        const issuedDate = new Date(issuedAt);
        const expiryDate = new Date(issuedDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        const remainingMs = expiryDate.getTime() - now.getTime();
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        
        return remainingDays > 0 ? remainingDays : 0;
    };

    // 吊销证书
    const handleRevokeCert = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/acme/certificates/${id}/revoke`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include', // 重要：包含cookies和session信息
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('acmeCertPage.revokeFailed'));
            }

            message.success(t('acmeCertPage.revokeSuccess'));
            tableQueryResult.refetch();
        } catch (error) {
            message.error(t('acmeCertPage.revokeFailed') + ": " + (error as any).message);
        }
    };

    return (
        <ConfigProvider locale={zhCN}>
            <List
                canCreate={false}
                title=""
            >
            {/* 搜索表单 */}
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
                            label={<span style={{ fontWeight: 500, color: '#595959' }}>{t('acmeCertPage.domainSearch')}</span>}
                            style={{ marginBottom: 0 }}
                        >
                            <Input.Search
                                style={{ width: 220 }}
                                placeholder={t('acmeCertPage.enterDomainKeyword')}
                                value={getCurrentDomainFilter()}
                                onChange={(e) => handleDomainSearch(e.target.value)}
                                onSearch={handleDomainSearch}
                                allowClear
                            />
                        </Form.Item>
                        
                        <Form.Item
                            label={<span style={{ fontWeight: 500, color: '#595959' }}>{t('acmeCertPage.certificateType')}</span>}
                            style={{ marginBottom: 0 }}
                        >
                            <Select
                                placeholder={t('acmeCertPage.selectCertType')}
                                options={certTypeOptions}
                                allowClear
                                style={{
                                    width: 140,
                                }}
                                dropdownStyle={{
                                    borderRadius: 6,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                                value={getCurrentTypeFilter()}
                                onChange={handleTypeFilter}
                            />
                        </Form.Item>
                        
                        <Form.Item
                            label={<span style={{ fontWeight: 500, color: '#595959' }}>{t('acmeCertPage.statusFilter')}</span>}
                            style={{ marginBottom: 0 }}
                        >
                            <Select
                                placeholder={t('acmeCertPage.selectStatus')}
                                options={statusOptions}
                                allowClear
                                style={{
                                    width: 140,
                                }}
                                dropdownStyle={{
                                    borderRadius: 6,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                                value={getCurrentStatusFilter()}
                                onChange={handleStatusFilter}
                            />
                        </Form.Item>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <CertApply 
                            key="cert-apply" 
                            onSuccess={() => {
                                // Refresh the list after certificate application success
                                tableQueryResult.refetch();
                            }} 
                        />
                    </div>
                </Form>
            </Card>
            <Table 
                {...tableProps} 
                rowKey="id"
                size="middle"
                tableLayout="fixed"
                pagination={{
                    ...tableProps.pagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    style: { marginTop: 16 }
                }}
                scroll={{ y: 'calc(100vh - 330px)' }}
            >

                {/* 优化表格样式 */}
                <style>{`
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
                    
                    /* 表格宽度控制 */
                    .ant-table-table {
                        width: 100% !important;
                        table-layout: fixed !important;
                    }
                    
                    /* 确保第一列紧贴左边 */
                    .ant-table-thead > tr > th:first-child,
                    .ant-table-tbody > tr > td:first-child {
                        padding-left: 16px !important;
                    }
                `}</style>
                <Table.Column 
                    dataIndex="id" 
                    title={t('acmeCertPage.id')}
                    width="200px"
                    ellipsis={{
                        showTitle: false,
                    }}
                    render={(value: string, record: BaseRecord) => (
                        <a
                            style={{ 
                                color: "#1677ff", 
                                cursor: "pointer",
                                fontFamily: 'monospace',
                                fontSize: '12px'
                            }}
                            title={value || ''}
                            onClick={() => {
                                if (record.id !== undefined && record.id !== null) {
                                    go({
                                        to: {
                                            resource: "acme/certificates",
                                            action: "show",
                                            id: record.id,
                                        }
                                    });
                                }
                            }}
                        >
                            {value.slice(0, 8)}...
                        </a>
                    )}
                />
                
                <Table.Column
                    dataIndex="domains"
                    title={t('acmeCertPage.domains')}
                    width="30%"
                    ellipsis={{
                        showTitle: false,
                    }}
                    render={(value: any[]) => (
                        <div title={value?.join(', ') || ''}>
                            {value?.map((item, index) => (
                                <TagField 
                                    value={item} 
                                    key={item} 
                                    style={{ 
                                        marginBottom: index < value.length - 1 ? 4 : 0 
                                    }}
                                />
                            ))}
                        </div>
                    )}
                />
                
                <Table.Column 
                    dataIndex="cert_type" 
                    title={t('acmeCertPage.certificateType')}
                    width="150px"
                    render={(value: string) => (
                        <Tag color={value === 'DV' ? 'blue' : 'purple'}>
                            {value}
                        </Tag>
                    )}
                />
                
                <Table.Column 
                    title={t('acmeCertPage.remainingDays')}
                    width="150px"
                    render={(_, record: any) => {
                        const remainingDays = calculateRemainingDays(record.issued_at, record.validity_days);
                        if (remainingDays === '-') {
                            return <span>-</span>;
                        }
                        
                        const days = Number(remainingDays);
                        let color = 'default';
                        if (days <= 0) {
                            color = 'red';
                        } else if (days <= 30) {
                            color = 'orange';
                        }
                        
                        return (
                            <Tag color={color}>
                                {days <= 0 ? t('acmeCertPage.expired') : `${days}${t('acmeCertPage.days')}`}
                            </Tag>
                        );
                    }}
                />
                
                <Table.Column 
                    dataIndex="cert_status" 
                    title={t('acmeCertPage.status')}
                    width="150px"
                    render={(value: string) => (
                        <Tag color={getStatusColor(value)}>
                            {getStatusText(value)}
                        </Tag>
                    )}
                />
                
                <Table.Column
                    title={t('acmeCertPage.actions')}
                    dataIndex="actions"
                    width="280px"
                    render={(_, record: BaseRecord) => {
                        const canRevoke = record.cert_status === 'issued';
                        
                        return (
                            <Space size={6}>
                                <Button
                                    size="small"
                                    type="link"
                                    onClick={() => window.open(`${API_BASE_URL}/acme/certificates/${record.id}/chain`, '_blank')}
                                    style={{
                                        height: '24px',
                                        padding: '0 8px',
                                        fontSize: '12px',
                                    }}
                                >
                                    {t('acmeCertPage.downloadCertChain')}
                                </Button>
                                {canAccessPrivateKey?.can && (
                                <Button
                                    size="small"
                                    type="link"
                                    onClick={() => window.open(`${API_BASE_URL}/acme/certificates/${record.id}/private_key`, '_blank')}
                                    style={{
                                        height: '24px',
                                        padding: '0 8px',
                                        fontSize: '12px',
                                    }}
                                >
                                    {t('acmeCertPage.downloadPrivateKey')}
                                </Button>
                                )}
                                {record.id && (
                                    <Popconfirm
                                        title={t('acmeCertPage.revokeCert')}
                                        description={canRevoke ? t('acmeCertPage.revokeConfirmation') : t('acmeCertPage.onlyIssuedCanBeRevoked')}
                                        onConfirm={() => canRevoke && handleRevokeCert(record.id as string)}
                                        okText={t('acmeCertPage.confirm')}
                                        cancelText={t('acmeCertPage.cancel')}
                                        disabled={!canRevoke}
                                    >
                                        <Button 
                                            size="small" 
                                            type="text"
                                            disabled={!canRevoke}
                                            style={{
                                                height: '24px',
                                                padding: '0 8px',
                                                fontSize: '12px',
                                                borderRadius: '4px',
                                                fontWeight: 500,
                                                transition: 'all 0.2s',
                                                border: canRevoke ? '1px solid #ff7875' : '1px solid #d9d9d9',
                                                backgroundColor: canRevoke ? '#fff2f0' : '#fafafa',
                                                color: canRevoke ? '#ff4d4f' : '#00000040',
                                                ...(canRevoke && {
                                                    ':hover': {
                                                        backgroundColor: '#ff4d4f',
                                                        color: '#fff',
                                                        borderColor: '#ff4d4f'
                                                    }
                                                })
                                            }}
                                            onMouseEnter={(e) => {
                                                if (canRevoke) {
                                                    e.currentTarget.style.backgroundColor = '#ff4d4f';
                                                    e.currentTarget.style.color = '#fff';
                                                    e.currentTarget.style.borderColor = '#ff4d4f';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (canRevoke) {
                                                    e.currentTarget.style.backgroundColor = '#fff2f0';
                                                    e.currentTarget.style.color = '#ff4d4f';
                                                    e.currentTarget.style.borderColor = '#ff7875';
                                                }
                                            }}
                                        >
                                            {t('acmeCertPage.revokeCert')}
                                        </Button>
                                    </Popconfirm>
                                )}
                                <Button
                                    size="small"
                                    type="text"
                                    danger
                                    onClick={() => {
                                        // 这里会触发 DeleteButton 的确认对话框
                                        const deleteBtn = document.querySelector(`[data-testid="delete-button-${record.id}"]`) as HTMLElement;
                                        if (deleteBtn) {
                                            deleteBtn.click();
                                        }
                                    }}
                                    style={{
                                        height: '24px',
                                        padding: '0 8px',
                                        fontSize: '12px',
                                        borderRadius: '4px',
                                        fontWeight: 500,
                                        transition: 'all 0.2s',
                                        border: '1px solid #ffccc7',
                                        backgroundColor: '#fff2f0',
                                        color: '#ff7875'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ff7875';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.borderColor = '#ff7875';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#fff2f0';
                                        e.currentTarget.style.color = '#ff7875';
                                        e.currentTarget.style.borderColor = '#ffccc7';
                                    }}
                                >
                                    {t('acmeCertPage.delete')}
                                </Button>
                                {/* 隐藏原始的 DeleteButton 但保留其功能 */}
                                <div style={{ display: 'none' }}>
                                    <DeleteButton
                                        size="small"
                                        recordItemId={record.id}
                                        data-testid={`delete-button-${record.id}`}
                                    />
                                </div>
                            </Space>
                        );
                    }}
                />
            </Table>
        </List>
        </ConfigProvider>
    );
};
