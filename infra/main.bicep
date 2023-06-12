param location string = resourceGroup().location

param containerImage string = 'iqengine/iqengine:pre'
param containerPort int = 3000
param registry string = 'ghcr.io'
param applicationName string = 'iqengine'
param subscriptionUnique string = uniqueString(subscription().subscriptionId)
param subiqueSubRes string = uniqueString(resourceGroup().id, subscriptionUnique)


module law 'law.bicep' = {
    name: 'log-analytics-workspace'
    params: {
      location: location
      name: 'law-${applicationName}'
    }
}

module mondodb 'mongodb.bicep' = {
  name: 'mongodb'
  params: {
    location: location
    name: 'mongodb-${applicationName}'
  }
}

module containerAppEnvironment 'environment.bicep' = {
  name: 'container-app-environment'
  params: {
    name: applicationName
    location: location
    lawClientId:law.outputs.clientId
    lawClientSecret: law.outputs.clientSecret
  }
}

module containerApp 'containerapp.bicep' = {
  name: 'container-app'
  params: {
    name: applicationName
    location: location
    containerAppEnvironmentId: containerAppEnvironment.outputs.id
    containerImage: containerImage
    containerPort: containerPort
    registry: registry
    useExternalIngress: true
    envVars: [
      {
        name: 'METADATA_DB_CONNECTION_STRING'
        value: mondodb.outputs.connectionString
      }
    ]
  }
}


output fqdn string = containerApp.outputs.fqdn
