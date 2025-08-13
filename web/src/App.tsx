import {Authenticated, Refine} from "@refinedev/core";
import {RefineKbar, RefineKbarProvider} from "@refinedev/kbar";

import {AntdInferencer} from "@refinedev/inferencer/antd";

import {ErrorComponent, ThemedLayoutV2, ThemedSiderV2, useNotificationProvider, ThemedTitleV2} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import { useList } from "@refinedev/core";
import { useEffect } from "react";
import { initializeLanguage } from "./utils/language";
import { useTranslation } from "react-i18next";

// 导入i18n配置
import './i18n';

 import { API_BASE_URL } from './config';
import {
    LineChartOutlined,
    SafetyCertificateOutlined,
    UserOutlined,
    SecurityScanOutlined,
    SettingOutlined,
    RobotOutlined,
    CloudOutlined,
    ContactsOutlined,
    TeamOutlined,
} from "@ant-design/icons";

// 自定义标题组件
const CustomTitle = ({ collapsed }: { collapsed: boolean }) => {
    return (
        <ThemedTitleV2
            text={<span style={{ color: '#6366f1', fontWeight: 600 }}>Easy ACME</span>}
            icon={<SafetyCertificateOutlined style={{ color: '#6366f1' }} />}
            collapsed={collapsed}
        />
    );
};

 const DebugAccounts = () => {
    const { data, isLoading, error } = useList({ resource: "acme/accounts" });
     console.log("useList data111:", data);
    useEffect(() => {
        console.log("useList data:", data);
        if (error) {
            console.error("useList error:", error);
        }
    }, [data, error]);

    return null;
};

import routerBindings, {
    CatchAllNavigate,
    DocumentTitleHandler,
    NavigateToResource,
    UnsavedChangesNotifier,
} from "@refinedev/react-router";
import dataProvider from "@refinedev/simple-rest";
import simpleRestDataProvider from "@refinedev/simple-rest";
import {App as AntdApp} from "antd";
import {BrowserRouter, Outlet, Route, Routes} from "react-router";
import { Menu } from "antd";
import {authProvider} from "./authProvider";
import {Header} from "./components/header";
//import {CustomSider} from "./components/sider-patch";
import {ColorModeContextProvider} from "./contexts/color-mode";
import {BlogPostCreate, BlogPostEdit, BlogPostList, BlogPostShow,} from "./pages/blog-posts";
import {CategoryCreate, CategoryEdit, CategoryList, CategoryShow,} from "./pages/categories";
import {ForgotPassword} from "./pages/forgotPassword";
import {Login} from "./pages/login";
import {Register} from "./pages/register";
import {UserList, UserShow, UserCreate, UserEdit} from "./pages/permissions";
import {RoleList, RoleShow, RoleCreate, RoleEdit} from "./pages/permissions";
import {ACMEList, ACMECreate, ACMEShow, ACMEEdit} from "./pages/acme-account";
import {CertApply, CertList, CertShow, CertEdit} from "./pages/acme-cert";
import {DNSList, DNSCreate, DNSShow, DNSEdit} from "./pages/dns-provider";
import { DashboardPage } from "./pages/dashboard";

const baseProvider = simpleRestDataProvider(API_BASE_URL);

const myDataProvider = {
    ...baseProvider,
    getList: async (params: any) => {
        console.log('Data Provider getList 被调用，参数:', params);
        
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // 构建查询参数
        const queryParams = new URLSearchParams();
        
        // 分页参数
        if (params.pagination) {
            queryParams.append('page', String(params.pagination.current || 1));
            queryParams.append('page_size', String(params.pagination.pageSize || 20));
            console.log('添加分页参数:', { page: params.pagination.current, page_size: params.pagination.pageSize });
        }
        
        // 过滤参数
        if (params.filters && params.filters.length > 0) {
            params.filters.forEach((filter: any) => {
                if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                    queryParams.append(filter.field, String(filter.value));
                    console.log('添加过滤参数:', { field: filter.field, value: filter.value, operator: filter.operator });
                }
            });
        }
        
        // 排序参数
        if (params.sorters && params.sorters.length > 0) {
            const sorter = params.sorters[0];
            queryParams.append('sortBy', sorter.field);
            queryParams.append('sortOrder', sorter.order);
            console.log('添加排序参数:', sorter);
        }
        
        const queryString = queryParams.toString();
        const url = `${API_BASE_URL}/${params.resource}${queryString ? `?${queryString}` : ''}`;
        console.log('最终请求URL:', url);

        const response = await fetch(url, {
            headers,
            credentials: 'include',
        });
        const data = await response.json();
        console.log('API响应数据:', data);
        
        return {
            data: data.data,
            total: data.total,
        };
    },
    getOne: async (params: any) => {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        const response = await fetch(`${API_BASE_URL}/${params.resource}/${params.id}`, {
            headers,
            credentials: 'include',
        });
        const data = await response.json();
        return { data };
    },
    create: async (params: any) => {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        const response = await fetch(`${API_BASE_URL}/${params.resource}`, {
            method: "POST",
            headers,
            credentials: 'include',
            body: JSON.stringify(params.variables),
        });
        const data = await response.json();
        return { data };
    },
    update: async (params: any) => {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        const method = params.meta?.method?.toUpperCase() || "PATCH";
        const response = await fetch(`${API_BASE_URL}/${params.resource}/${params.id}`, {
            method,
            headers,
            credentials: 'include',
            body: JSON.stringify(params.variables),
        });
        const data = await response.json();
        return { data };
    },
    deleteOne: async (params: any) => {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        const response = await fetch(`${API_BASE_URL}/${params.resource}/${params.id}`, {
            method: "DELETE",
            headers,
            credentials: 'include',
        });
        const data = await response.json();
        return { data };
    },
    deleteMany: async (params: any) => {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // 批量删除，逐个调用删除接口
        const promises = params.ids.map((id: string) => 
            fetch(`${API_BASE_URL}/${params.resource}/${id}`, {
                method: "DELETE",
                headers,
                credentials: 'include',
            })
        );
        await Promise.all(promises);
        return { data: [] };
    },
};

function App() {
    useEffect(() => {
        document.title = "Easy ACME";
        // 初始化应用语言设置
        initializeLanguage();
    }, []);

    const { t } = useTranslation();

    return (
        <BrowserRouter>
            {/* 精确隐藏logout菜单项，不影响二级菜单 */}
            <style>{`
              /* 只隐藏根级菜单的logout项 */
              .ant-menu-item[data-menu-id*="logout"],
              .ant-menu-item[title="退出登录"],
              .ant-menu-item[title="Logout"] {
                display: none !important;
              }
              
              /* 只隐藏根级菜单的最后一个项目，不影响子菜单 */
              .ant-layout-sider .ant-menu.ant-menu-root > .ant-menu-item:last-child:not(.ant-menu-submenu) {
                display: none !important;
              }
            `}</style>
            <RefineKbarProvider>
                <ColorModeContextProvider>
                    <AntdApp>
                        <Refine
                            dataProvider={myDataProvider}//https://api.fake-rest.refine.dev
                            notificationProvider={useNotificationProvider}
                            routerProvider={routerBindings}
                            authProvider={authProvider}
                            resources={[
                                // {
                                //     name: "blog_posts",
                                //     list: "/blog-posts",
                                //     create: "/blog-posts/create",
                                //     edit: "/blog-posts/edit/:id",
                                //     show: "/blog-posts/show/:id",
                                //     meta: {
                                //         canDelete: true,
                                //     },
                                // },
                                // {
                                //     name: "categories",
                                //     list: "/categories",
                                //     create: "/categories/create",
                                //     edit: "/categories/edit/:id",
                                //     show: "/categories/show/:id",
                                //     meta: {
                                //         canDelete: true,
                                //     },
                                // },
                                // {
                                //     name: "users",
                                //     list: "/users",
                                //     create: AntdInferencer,
                                //     edit: AntdInferencer,
                                //     show: "users/show/:id",
                                //     meta: {
                                //         canDelete: true,
                                //     },
                                // },
                                {
                                    name: "dashboard",
                                    list: "/",
                                    meta: {
                                        label: t("menu.dashboard"),
                                        icon: <LineChartOutlined />,
                                    },
                                },
                                {
                                    name: "dns/provider",
                                    list: "dns/provider",
                                    create: "dns/provider/create",
                                    edit: "dns/provider/edit/:id",
                                    show: "dns/provider/show/:id",
                                    meta: {
                                        canDelete: true,
                                        label: t("menu.dnsProvider"),
                                        icon: <CloudOutlined />,
                                    },

                                },
                                {
                                    name: "acme/accounts",
                                    list: "/acme/accounts",
                                    create: "/acme/accounts/create",
                                    edit: "/acme/accounts/edit/:id",
                                    show: "/acme/accounts/show/:id",
                                    meta: {
                                        canDelete: true,
                                        label: t("menu.acmeAccounts"),
                                        icon: <ContactsOutlined />,
                                    },

                                },
                                {
                                    name: "acme/certificates",
                                    list: "/acme/certificates",
                                    edit: "/acme/certificates/edit/:id",
                                    show: "/acme/certificates/show/:id",
                                    meta: {
                                        canDelete: true,
                                        label: t("menu.certificates"),
                                    },
                                },
                                {
                                    name: "system",
                                    meta: {
                                        label: t("menu.system"),
                                        icon: <SettingOutlined />,
                                    },
                                },
                                {
                                    name: "account/users",
                                    list: "account/users",
                                    create: "account/users/create",
                                    edit: "account/users/edit/:id",
                                    show: "account/users/show/:id",
                                    meta: {
                                        label: t("menu.users"),
                                        icon: <UserOutlined />,
                                        parent: "system",
                                    },
                                },
                                {
                                    name: "account/roles",
                                    list: "account/roles",
                                    create: "account/roles/create",
                                    edit: "account/roles/edit/:id",
                                    show: "account/roles/show/:id",
                                    meta: {
                                        label: t("menu.roles"),
                                        icon: <TeamOutlined />,
                                        parent: "system",
                                    },
                                },
                            ]}
                            options={{
                                syncWithLocation: true,
                                warnWhenUnsavedChanges: true,
                                useNewQueryKeys: true,
                                projectId: "vwuLlk-pMI0Ar-maRTdk",
                                title: {
                                    icon: <SafetyCertificateOutlined style={{ color: '#6366f1' }} />,
                                    text: "Easy ACME"
                                }
                            }}
                        >
                            <Routes>
                                <Route
                                    element={
                                        <Authenticated
                                            key="authenticated-inner"
                                            fallback={<CatchAllNavigate to="/login"/>}
                                        >
                                            <ThemedLayoutV2
                                                Header={Header}
                                                Title={CustomTitle}
                                                //Sider={CustomSider}
                                            >
                                                <Outlet/>
                                            </ThemedLayoutV2>
                                        </Authenticated>
                                    }
                                >
                                    <Route index element={<DashboardPage />} />

                                    <Route path="/categories">
                                        <Route index element={<CategoryList/>}/>
                                        <Route path="create" element={<CategoryCreate/>}/>
                                        <Route path="edit/:id" element={<CategoryEdit/>}/>
                                        <Route path="show/:id" element={<CategoryShow/>}/>
                                    </Route>
                                    <Route path="account/users">
                                        <Route index element={<UserList/>}/>
                                        <Route path="create" element={<UserCreate/>}/>
                                        <Route path="edit/:id" element={<UserEdit/>}/>
                                        <Route path="show/:id" element={<UserShow/>}/>
                                    </Route>
                                    <Route path="account/roles">
                                        <Route index element={<RoleList/>}/>
                                        <Route path="create" element={<RoleCreate/>}/>
                                        <Route path="edit/:id" element={<RoleEdit/>}/>
                                        <Route path="show/:id" element={<RoleShow/>}/>
                                    </Route>
                                    <Route path="/dns/provider">
                                        <Route index element={
                                            <>
                                                <DebugAccounts />
                                                <DNSList />
                                            </>
                                        }/>
                                        {/* 其他子路由 */}
                                        <Route path="create" element={<DNSCreate/>}/>
                                        <Route path="edit/:id" element={<DNSEdit/>}/>
                                        <Route path="show/:id" element={<DNSShow/>}/>
                                    </Route>
                                    <Route path="/acme/accounts">
                                        <Route index element={
                                            <>
                                                <DebugAccounts />
                                                <ACMEList />
                                            </>
                                        }/>
                                        {/* 其他子路由 */}
                                        <Route path="create" element={<ACMECreate/>}/>
                                        <Route path="edit/:id" element={<ACMEEdit/>}/>
                                        <Route path="show/:id" element={<ACMEShow/>}/>
                                    </Route>
                                    <Route path="/acme/certificates">
                                        <Route index element={
                                            <>
                                                <DebugAccounts />
                                                <CertList />
                                            </>
                                        }/>
                                        {/* 其他子路由 */}
                                        <Route path="edit/:id" element={<CertEdit/>}/>
                                        <Route path="show/:id" element={<CertShow/>}/>
                                    </Route>
                                    <Route path="*" element={<ErrorComponent/>}/>
                                </Route>
                                <Route
                                    element={
                                        <Authenticated
                                            key="authenticated-outer"
                                            fallback={<Outlet/>}
                                        >
                                            <NavigateToResource/>
                                        </Authenticated>
                                    }
                                >
                                    <Route path="/login" element={<Login/>}/>
                                    <Route path="/register" element={<Register/>}/>
                                    <Route
                                        path="/forgot-password"
                                        element={<ForgotPassword/>}
                                    />
                                </Route>
                            </Routes>

                            <RefineKbar/>
                            <UnsavedChangesNotifier/>
                            <DocumentTitleHandler/>
                        </Refine>
                    </AntdApp>
                </ColorModeContextProvider>
            </RefineKbarProvider>
        </BrowserRouter>
    );
}

export default App;
