class AnalyticsService {
  initialize() {
    return {
      enabled: false,
      reason: 'Analytics provider not connected yet; service scaffold is ready.'
    };
  }
}

module.exports = { AnalyticsService };
