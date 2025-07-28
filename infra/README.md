For the Azure "click to deploy" link see https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FIQEngine%2FIQEngine%2Fmain%2Finfra%2Fiqengine.json

These bicep templates are meant for folks already familiar with deploying resources in Azure using bicep.

Notes
- recommend replacing uniqueSuffix with some identifier, since everything will be called xyz-iqengine-uniqueSuffix
- it seems fine to leave adAppClientId as the default zeros
- this only creates the backend/frontend, you'll also need to set up the storage account and plugins server separately
- tested to work 12/1/23, although doesnt configure the env vars, incl DB_ENCRYPTION_KEY which is needed (see backend docs for generating it, it doesnt have to match anything else)

## AWS S3 and ECS Hosting

Used rclone to do a one-time copy from blob to s3, eg:

`rclone copy blob:northeastern aws:iqengine-northeastern --bwlimit 10M`

For running the app on EC2 using Amazon Linux 2023, with https working:

```bash
sudo yum update -y
sudo yum install -y git
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user
sudo reboot
git clone https://github.com/IQEngine/IQEngine.git
sudo dnf install -y augeas-libs
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
sudo /opt/certbot/bin/pip install certbot
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot
sudo certbot certonly --standalone
echo "0 0,12 * * * root /opt/certbot/bin/python -c 'import random; import time; time.sleep(random.random() * 3600)' && sudo certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
docker run --restart unless-stopped --log-opt max-size=50m --env-file .env --add-host host.docker.internal:host-gateway -p 80:3000 -p 443:3000 -v /etc/letsencrypt/archive/iqengine.org:/app/certs --pull=always -d ghcr.io/iqengine/iqengine:pre uvicorn --host 0.0.0.0 --port 3000 --workers 1 --ssl-keyfile /app/certs/privkey1.pem --ssl-certfile /app/certs/cert1.pem main:app
docker run -p 8000:8000 --pull=always -d ghcr.io/iqengine/iqengine-plugins:pre
```

Disk space needed is about 27GB

See the .env file on the VM for the rest of the details

Switched to running mongo locally for cost sake (smallest DocumentdB in AWS is pretty expensive), set up using https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-amazon/ 

Edit /etc/mongod.conf to change bind to 0.0.0.0 (no colons or comma)

IQENGINE_METADATA_DB_CONNECTION_STRING=mongodb://host.docker.internal:27017

Note the --add-host part that is included in the docker run cmd
