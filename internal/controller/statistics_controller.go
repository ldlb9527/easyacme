package controller

import (
	"easyacme/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"net/http"
)

type StatisticsController struct {
	logger        *zap.Logger
	statisticsSvc service.StatisticsService
}

func NewStatisticsController(logger *zap.Logger, statisticsSvc service.StatisticsService) *StatisticsController {
	return &StatisticsController{
		logger:        logger,
		statisticsSvc: statisticsSvc,
	}
}

func (c *StatisticsController) GetStatistics(ctx *gin.Context) {
	stats, err := c.statisticsSvc.GetStatistics(ctx)
	if err != nil {
		c.logger.Error("failed to get statistics", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get statistics"})
		return
	}

	ctx.JSON(http.StatusOK, stats)
}
