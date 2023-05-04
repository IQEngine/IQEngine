from selenium import webdriver
import os.path
import time

try:
    driver = webdriver.Firefox()
    print("Using webdriver.Firefox()")
except:
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        driver = webdriver.Chrome(ChromeDriverManager().install())
        print("Using webdriver.Chrome()")
    except:
        try:
            homedir = os.path.expanduser("~")
            driver = webdriver.Chrome(f"{homedir}/chromedriver/stable/chromedriver")
            print("Using webdriver.Chrome(~/chromedriver/stable/chromedriver")
        except:
            raise Exception('Couldnt find a working webdriver')

if os.getenv('STAGING_URL'):
    url = os.getenv('STAGING_URL')
else:
    url = "http://127.0.0.1:3000"
driver.get(url)
print(driver.title)
try:
    submit_button = driver.find_element("id", 'GNURadioSigMFRepo') # name, xpath, class name, link text
    submit_button.click()
    time.sleep(1)
    driver.find_element("xpath", "//img[@src='https://gnuradio.blob.core.windows.net/iqengine/cellular_downlink_880MHz.jpeg']")
    link = driver.find_element("link text", "cellular_downlink_880MHz")
    link.click()
    time.sleep(5)
    driver.find_element("id", 'formMagMax')
    toggle = driver.find_element("class name", 'react-toggle')
    toggle.click()
    time.sleep(1)
    time_tab = driver.find_element("id", 'tabs-tab-time')
    time_tab.click()
    time.sleep(1)
    time_plot = driver.find_element("class name", 'js-line')
    if len(time_plot.get_attribute('d')) < 10000:
        raise Exception('time plot js-line didnt contain at least 10000 numbers')
except Exception as e:
    print('Error:', e)
    raise
print("Test passed!")