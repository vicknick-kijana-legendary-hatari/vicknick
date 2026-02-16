class SubscriptionVerificationService {
  initialize() {
    return {
      enabled: false,
      reason: 'Subscription verification will be connected to backend APIs.'
    };
  }
}

module.exports = { SubscriptionVerificationService };
