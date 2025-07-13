export interface AcmeStats {
    // 账户统计
    totalAccounts: number;
    validAccounts: number;
    deactivatedAccounts: number;

    // DNS提供商统计
    dnsProviders: {
        name: string;
        count: number;
    }[];

    // 证书统计
    certificates: {
        total: number;
        valid: number;
        expired: number;
        revoked: number;
        monthlyIssued: {
            month: string;
            count: number;
        }[];
    };
}