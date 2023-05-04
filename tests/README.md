# Run Integration Tests

## Install Chrome webdriver
```
cd ~
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install
google-chrome-stable --version
chrome_driver=$(curl "https://chromedriver.storage.googleapis.com/LATEST_RELEASE")
curl -Lo chromedriver_linux64.zip "https://chromedriver.storage.googleapis.com/${chrome_driver}/chromedriver_linux64.zip"
sudo apt install unzip
mkdir -p "chromedriver/stable"
unzip -q "chromedriver_linux64.zip" -d "chromedriver/stable"
chmod +x "chromedriver/stable/chromedriver"
```

## Install other Requirements
```
cd tests
sudo pip install -r requirements.txt
```

## Run the Tests
```
python main.py
```