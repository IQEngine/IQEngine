param location string = resourceGroup().location
param containerImage string = 'iqengine/iqengine:pre'
param containerPort int = 3000
param registry string = 'ghcr.io'
param applicationName string = 'iqengine'
param uniqueSuffix string = substring(uniqueString((resourceGroup().id)), 0, 5)


module law 'law.bicep' = {
    name: 'log-analytics-workspace'
    params: {
      location: location
      name: 'law-${applicationName}-${uniqueSuffix}'
    }
}

module mondodb 'mongodb.bicep' = {
  name: 'mongodb'
  params: {
    location: location
    name: 'mongodb-${applicationName}-${uniqueSuffix}'
  }
}

module containerAppEnvironment 'environment.bicep' = {
  name: 'container-app-environment'
  params: {
    name: 'appenv-${applicationName}-${uniqueSuffix}'
    location: location
    lawClientId:law.outputs.clientId
    lawClientSecret: law.outputs.clientSecret
  }
}

module containerApp 'containerapp.bicep' = {
  name: 'container-app'
  params: {
    name: '${applicationName}-${uniqueSuffix}'
    location: location
    containerAppEnvironmentId: containerAppEnvironment.outputs.id
    containerImage: containerImage
    containerPort: containerPort
    registry: registry
    useExternalIngress: true
    envVars: [
      {
        name: 'IQENGINE_METADATA_DB_CONNECTION_STRING'
        value: mondodb.outputs.connectionString
      }
    ]
  }
}


output fqdn string = containerApp.outputs.fqdn
