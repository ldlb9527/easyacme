package service

import (
	"context"
	"go.uber.org/zap"
)

// Statistics a flattened structure for the frontend dashboard
type Statistics struct {
	TotalAccounts       int64             `json:"totalAccounts"`
	ValidAccounts       int64             `json:"validAccounts"`
	DeactivatedAccounts int64             `json:"deactivatedAccounts"`
	DNSProviders        []DNSProviderStat `json:"dnsProviders"`
	Certificates        *CertStats        `json:"certificates"`
}

type StatisticsService interface {
	GetStatistics(ctx context.Context) (*Statistics, error)
}

type statisticsServiceImpl struct {
	logger         *zap.Logger
	acmeAccountSvc AcmeAccountService
	dnsSvc         DNSService
	acmeCertSvc    AcmeCertService
}

func NewStatisticsService(
	logger *zap.Logger,
	acmeAccountSvc AcmeAccountService,
	dnsSvc DNSService,
	acmeCertSvc AcmeCertService,
) StatisticsService {
	return &statisticsServiceImpl{
		logger:         logger,
		acmeAccountSvc: acmeAccountSvc,
		dnsSvc:         dnsSvc,
		acmeCertSvc:    acmeCertSvc,
	}
}

func (s *statisticsServiceImpl) GetStatistics(ctx context.Context) (*Statistics, error) {
	accountStats, err := s.acmeAccountSvc.GetAccountStats(ctx)
	if err != nil {
		s.logger.Error("failed to get account stats", zap.Error(err))
		return nil, err
	}

	dnsStats, err := s.dnsSvc.GetDNSProviderStats(ctx)
	if err != nil {
		s.logger.Error("failed to get dns provider stats", zap.Error(err))
		return nil, err
	}

	certStats, err := s.acmeCertSvc.GetCertStats(ctx)
	if err != nil {
		s.logger.Error("failed to get cert stats", zap.Error(err))
		return nil, err
	}

	// The frontend mock data doesn't seem to include revoked accounts in the top-level stats,
	// so we only return Total, Valid, and Deactivated here to match the dashboard component.
	stats := &Statistics{
		TotalAccounts:       accountStats.Total,
		ValidAccounts:       accountStats.Valid,
		DeactivatedAccounts: accountStats.Deactivated,
		DNSProviders:        dnsStats,
		Certificates:        certStats,
	}

	return stats, nil
}
