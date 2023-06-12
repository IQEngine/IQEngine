// general Azure Container App settings
param location string
param name string

resource databaseAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  location: location
  name: name
  kind: 'MongoDB'
  properties: {
    publicNetworkAccess: 'Enabled'
    databaseAccountOfferType: 'Standard'
    defaultIdentity: 'FirstPartyIdentity'
    disableLocalAuth: false
    apiProperties: {
      serverVersion: '4.2'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableMongo'
      }
      {
        name: 'DisableRateLimitingResponses'
      }
      {
        name: 'EnableServerless'
      }
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: 8
        backupStorageRedundancy: 'Geo'
      }
    }
  }
}

output connectionString string = databaseAccount.listConnectionStrings().connectionStrings[0].connectionString
