import requests
from bs4 import BeautifulSoup

def fetch_wikipedia_html(url):
    # 发送 HTTP 请求获取网页内容
    try:
        response = requests.get(url)
        # 检查请求是否成功
        if response.status_code == 200:
            # 解析网页 HTML
            html_content = response.text
            return html_content
        else:
            print(f"Error: Unable to fetch the page, status code: {response.status_code}")
            return None
    except requests.RequestException as e:
        print(f"Error fetching the URL: {e}")
        return None

def main():
    # 输入维基百科的页面 URL
    # url = input("请输入维基百科的 URL：")

    url = "https://zh.wikipedia.org/wiki/%E5%94%90%E6%9C%9D"
    
    # 获取 HTML 内容
    html_content = fetch_wikipedia_html(url)
    
    if html_content:
        # 打印 HTML 内容
        print("维基百科页面的 HTML 结构如下：")
        print(html_content)

if __name__ == "__main__":
    main()
