// general Azure Container App settings
param location string
param name string
param containerAppEnvironmentId string

// Container Image ref
param containerImage string = 'iqengine/iqengine:latest'
param registry string = 'ghcr.io'

// Networking
param useExternalIngress bool = true
param containerPort int = 3000

param minReplicas int = 1
param maxReplicas int = 10

param envVars array = []


resource containerApp 'Microsoft.App/containerApps@2022-11-01-preview' = {
  name: name
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironmentId
    environmentId: containerAppEnvironmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: useExternalIngress
        targetPort: containerPort
        allowInsecure: true
      }
    }
    template: {
      containers: [
        {
          image: '${registry}/${containerImage}'
          name: name
          env: envVars
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

output fqdn string = containerApp.properties.configuration.ingress.fqdn
