import React, { useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Space, 
  Progress, 
  Table, 
  Badge,
  Avatar,
  Tag,
  Tooltip,
  Divider,
  Skeleton,
  Alert
} from "antd";
import { 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  CloudOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  StopOutlined,
  TrophyOutlined,
  CheckOutlined,
  WarningOutlined
} from "@ant-design/icons";
// @ts-ignore
import { Line, Column, Pie } from "@ant-design/charts";
import type { AcmeStats } from "./acme";
import { API_BASE_URL } from "../../config";

const { Title, Text } = Typography;

// 迷你统计组件
const MiniStat = ({ 
  title, 
  value, 
  icon, 
  color, 
  trend
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}) => (
  <div style={{ textAlign: 'center', padding: '12px' }}>
    <div style={{ 
      width: 48, 
      height: 48, 
      borderRadius: '12px', 
      backgroundColor: color + '15',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      color: color,
      margin: '0 auto 12px'
    }}>
      {icon}
    </div>
    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
      {value.toLocaleString()}
    </div>
    <Text style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
      {title}
    </Text>
    {trend && (
      <Tag 
        color={trend.startsWith('+') ? 'success' : 'warning'} 
        style={{ 
          fontSize: '10px',
          padding: '1px 4px',
          borderRadius: '4px'
        }}
      >
        {trend}
      </Tag>
    )}
  </div>
);

export const DashboardPage: React.FC = () => {
  const { data: identity } = useGetIdentity<{
    id: string;
    name: string;
    avatar: string;
  }>();
  
  const { t } = useTranslation();

  const [statsData, setStatsData] = useState<{ data: AcmeStats } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        const response = await fetch(`${API_BASE_URL}/stats`, {
          method: "GET",
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`);
        }
        
        const responseData = await response.json();
        setStatsData({ data: responseData });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const [animatedStats, setAnimatedStats] = useState({
    totalAccounts: 0,
    validAccounts: 0,
    deactivatedAccounts: 0,
    totalCerts: 0
  });

  // 数字动画效果
  useEffect(() => {
    if (!statsData?.data) return;

    const duration = 1500;
    const steps = 50;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedStats({
        totalAccounts: Math.floor(statsData.data.totalAccounts * progress),
        validAccounts: Math.floor(statsData.data.validAccounts * progress),
        deactivatedAccounts: Math.floor(statsData.data.deactivatedAccounts * progress),
        totalCerts: Math.floor(statsData.data.certificates.total * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          totalAccounts: statsData.data.totalAccounts,
          validAccounts: statsData.data.validAccounts,
          deactivatedAccounts: statsData.data.deactivatedAccounts,
          totalCerts: statsData.data.certificates.total
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [statsData]);

  if (isLoading) {
    return (
      <div style={{ padding: '16px' }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (isError || !statsData?.data) {
    return (
      <div style={{ padding: '16px' }}>
        <Alert
          message={t("dashboard.error")}
          description={t("dashboard.errorDesc")}
          type="error"
          showIcon
        />
      </div>
    );
  }

  const { data: dashboardData } = statsData;

  // 趋势图配置
  const lineConfig = {
    data: dashboardData.certificates.monthlyIssued,
    xField: 'month',
    yField: 'count',
    smooth: true,
    color: '#6366f1',
    point: {
      size: 3,
      shape: 'circle',
      style: {
        fill: '#6366f1',
        stroke: '#6366f1',
        lineWidth: 2,
      },
    },
    line: {
      style: {
        lineWidth: 2,
      },
    },
    xAxis: {
      grid: null,
      line: null,
      tickLine: null,
      label: {
        style: {
          fontSize: 10,
          fill: '#64748b',
        },
      },
    },
    yAxis: {
      grid: {
        line: {
          style: {
            stroke: '#f1f5f9',
            lineWidth: 1,
          },
        },
      },
      line: null,
      tickLine: null,
      label: {
        style: {
          fontSize: 10,
          fill: '#64748b',
        },
      },
    },
    tooltip: {
      showMarkers: false,
      formatter: (datum: any) => {
        return { name: t("dashboard.issueTrend"), value: `${datum.count} ${t("dashboard.totalCerts")}` };
      },
    },
  };

  // 状态柱状图配置
  const columnConfig = {
    data: [
      { status: t("dashboard.valid"), count: dashboardData.certificates.valid, color: '#10b981' },
      { status: t("dashboard.expired"), count: dashboardData.certificates.expired, color: '#f59e0b' },
      { status: t("dashboard.revoked"), count: dashboardData.certificates.revoked, color: '#ef4444' },
    ],
    xField: 'status',
    yField: 'count',
    color: ['#10b981', '#f59e0b', '#ef4444'],
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    label: {
      position: 'top' as const,
      style: {
        fontSize: 10,
        fontWeight: 'bold',
      },
    },
    xAxis: {
      label: {
        style: {
          fontSize: 10,
          fill: '#64748b',
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fontSize: 10,
          fill: '#64748b',
        },
      },
    },
  };

  // 饼图配置
  const pieConfig = {
    data: dashboardData.dnsProviders,
    angleField: 'count',
    colorField: 'name',
    radius: 0.8,
    innerRadius: 0.4,
    color: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
    label: false,
    legend: false,
    interactions: [{ type: 'element-active' }],
    tooltip: {
      formatter: (datum: any) => {
        return { name: datum.name, value: `${datum.count} ${t("dashboard.domains")}` };
      },
    },
  };

  const dnsProviderColumns = [
    {
      title: t("dashboard.provider"),
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Space size={6}>
          <div style={{
            width: 20,
            height: 20,
            borderRadius: '4px',
            backgroundColor: '#6366f1',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            {text.charAt(0)}
          </div>
          <Text style={{ fontSize: '12px' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: t("dashboard.count"),
      dataIndex: "count",
      key: "count",
      render: (count: number) => (
        <Text strong style={{ fontSize: '12px' }}>{count}</Text>
      ),
    },
    {
      title: t("dashboard.percentage"),
      key: "percentage",
      render: (_: any, record: any) => {
        const total = dashboardData.dnsProviders.reduce((sum, item) => sum + item.count, 0);
        const percentage = total > 0 ? Math.round((record.count / total) * 100) : 0;
        return (
          <Text style={{ fontSize: '11px' }}>{percentage}%</Text>
        );
      },
    },
  ];

  return (
    <div style={{ 
      padding: '16px', 
      minHeight: '100vh'
    }}>

      
      <Row gutter={[16, 16]}>
        {/* 账户统计合并卡片 */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <UserOutlined style={{ color: '#6366f1' }} />
                <span>{t("dashboard.accountStats")}</span>
              </Space>
            }
            bordered={false}
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: '16px 0' }}
          >
            <Row>
              <Col span={8}>
                <MiniStat
                  title={t("dashboard.total")}
                  value={animatedStats.totalAccounts}
                  icon={<UserOutlined />}
                  color="#6366f1"
                  trend="+12.5%"
                />
              </Col>
              <Col span={8}>
                <MiniStat
                  title={t("dashboard.valid")}
                  value={animatedStats.validAccounts}
                  icon={<CheckCircleOutlined />}
                  color="#10b981"
                  trend="+8.3%"
                />
              </Col>
              <Col span={8}>
                <MiniStat
                  title={t("dashboard.deactivated")}
                  value={animatedStats.deactivatedAccounts}
                  icon={<CloseCircleOutlined />}
                  color="#f59e0b"
                  trend="-3.1%"
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 证书统计合并卡片 */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#8b5cf6' }} />
                <span>{t("dashboard.certManagement")}</span>
                <Tag color="blue" style={{ fontSize: '10px' }}>
                  {t("dashboard.totalCerts")} {animatedStats.totalCerts} {t("dashboard.domains")}
                </Tag>
              </Space>
            }
            bordered={false}
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <Row gutter={16}>
              <Col xs={24} lg={16}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '13px' }}>{t("dashboard.issueTrend")}</Text>
                </div>
                <div style={{ height: 160 }}>
                  <Line {...lineConfig} />
                </div>
              </Col>
              <Col xs={24} lg={8}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '13px' }}>{t("dashboard.statusDistribution")}</Text>
                </div>
                <div style={{ height: 160 }}>
                  <Column {...columnConfig} />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* DNS管理合并卡片 */}
        <Col span={24}>
          <Card 
            title={
              <Space>
                <CloudOutlined style={{ color: '#06b6d4' }} />
                <span>{t("dashboard.dnsProviderManagement")}</span>
                <Tag color="green" style={{ fontSize: '10px' }}>
                  {dashboardData.dnsProviders.reduce((sum, item) => sum + item.count, 0)} {t("dashboard.domains")}
                </Tag>
              </Space>
            }
            bordered={false}
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: '16px' }}
          >
            <Row gutter={16}>
              <Col xs={24} md={10}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '13px' }}>{t("dashboard.providerDistribution")}</Text>
                </div>
                <div style={{ height: 200 }}>
                  <Pie {...pieConfig} />
                </div>
              </Col>
              <Col xs={24} md={14}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '13px' }}>{t("dashboard.details")}</Text>
                </div>
                <Table
                  dataSource={dashboardData.dnsProviders}
                  columns={dnsProviderColumns}
                  pagination={false}
                  size="small"
                  style={{ height: '200px' }}
                />
                
                {/* 服务商图例 */}
                <div style={{ marginTop: '12px' }}>
                  <Space wrap>
                    {dashboardData.dnsProviders.map((provider, index) => {
                      const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];
                      return (
                        <Space key={provider.name} size={4}>
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: colors[index % colors.length]
                          }} />
                          <Text style={{ fontSize: '11px' }}>{provider.name}</Text>
                        </Space>
                      );
                    })}
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>


      </Row>

      {/* 优化CSS样式 */}
      <style>{`
        .ant-card-head-title {
          font-weight: 600;
          font-size: 14px;
        }
        
        .ant-table-thead > tr > th {
          background: transparent;
          border: none;
          font-weight: 600;
          padding: 6px 8px;
          font-size: 11px;
        }
        
        .ant-table-tbody > tr > td {
          border: none;
          padding: 6px 8px;
        }
        
        .ant-table-tbody > tr:hover > td {
          background: rgba(99, 102, 241, 0.04);
        }
        
        .ant-card {
          border: 1px solid rgba(0,0,0,0.06);
        }
        
        .ant-card-head {
          min-height: 40px;
          padding: 0 16px;
        }
      `}</style>
    </div>
  );
};
