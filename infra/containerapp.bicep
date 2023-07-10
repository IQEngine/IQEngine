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

// Container auth configuration
param adAppClientId string
param deployContainerAppAuth bool


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
        allowInsecure: false
        stickySessions: {
          affinity: 'sticky'
        }
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

resource containerAppConfig 'Microsoft.App/containerApps/authConfigs@2022-06-01-preview' = if (deployContainerAppAuth) {
  name: 'current'
  parent: containerApp
  properties: {
    platform: {
      enabled: true
    }
    identityProviders: {
      azureActiveDirectory:{
        enabled: true
        isAutoProvisioned: true
        registration: {
          clientId: adAppClientId
          openIdIssuer: 'https://sts.windows.net/${subscription().tenantId}/v2.0'
        }
        validation: {
          allowedAudiences: [
            'api://${adAppClientId}'
          ]
        }
      }
    }
    globalValidation: {
      redirectToProvider: 'azureActiveDirectory'
      unauthenticatedClientAction: 'RedirectToLoginPage'
    }
  }
}

output fqdn string = containerApp.properties.configuration.ingress.fqdn
