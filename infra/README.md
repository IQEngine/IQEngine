For the Azure "click to deploy" link see https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FIQEngine%2FIQEngine%2Fmain%2Finfra%2Fiqengine.json

These bicep templates are meant for folks already familiar with deploying resources in Azure using bicep.

Notes
- recommend replacing uniqueSuffix with some identifier, since everything will be called xyz-iqengine-uniqueSuffix
- it seems fine to leave adAppClientId as the default zeros
- this only creates the backend/frontend, you'll also need to set up the storage account and plugins server separately
- tested to work 12/1/23, although doesnt configure the env vars, incl DB_ENCRYPTION_KEY which is needed (see backend docs for generating it, it doesnt have to match anything else)
