param name string
param location string
param lawClientId string
@secure()
param lawClientSecret string

resource env 'Microsoft.App/managedEnvironments@2022-11-01-preview' = {
  name: name
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: lawClientId
        sharedKey: lawClientSecret
      }
    }
    zoneRedundant: false
  }
}
output id string = env.id
