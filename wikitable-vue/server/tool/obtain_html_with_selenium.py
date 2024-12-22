from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def obtain_html_with_selenium(url):
    # 设置 Chrome 无头模式（不弹出浏览器）
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")  # 禁用 GPU 加速
    chrome_options.add_argument("--no-sandbox")  # 避免在某些环境中出现问题
    chrome_options.add_argument('User-Agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')  # 设置 User-Agent

    # 初始化 WebDriver
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        driver.get(url)
        
        # 等待页面加载完成，确保关键资源被加载
        # 你可以选择等待某个页面元素加载完成，比如等待一个特定的图片或者元素
        WebDriverWait(driver, 2).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # 等待图片和 CSS 加载完成
        WebDriverWait(driver, 2).until(
            EC.presence_of_all_elements_located((By.TAG_NAME, "img"))
        )

        # 获取整个页面的 HTML
        html_content = driver.page_source

        # 返回页面 HTML
        return html_content
    except Exception as e:
        print(f"Error fetching the URL: {e}")
        return None
    finally:
        driver.quit()

# 测试代码
html_content = obtain_html_with_selenium("https://baike.baidu.com/item/%E5%94%90%E6%9C%9D/53699")
print(html_content)
