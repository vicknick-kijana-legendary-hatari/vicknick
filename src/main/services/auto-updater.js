class AutoUpdaterService {
  initialize() {
    return {
      enabled: false,
      reason: 'Auto updates will be configured during release signing setup.'
    };
  }
}

module.exports = { AutoUpdaterService };
