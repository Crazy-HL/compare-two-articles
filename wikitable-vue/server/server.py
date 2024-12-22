# app.py
import tornado.ioloop
import tornado.web
import json
from tool.obtainHtml import obtain_html
# from tool.obtain_html_with_selenium import obtain_html_with_selenium
class MainHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")
    def get(self):
        self.write("Welcome to the Tornado Server!")

class DataHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")

    def get(self):
        papername = self.get_argument('papername')
        print(papername)
        # self.set_header("Content-Type", "application/json")
        data = {}
        self.write(json.dumps(data))

class HtmlHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")
    def get(self):
        url = self.get_argument('url')
        html = obtain_html(url)  # 获取 HTML 内容
        # html = obtain_html_with_selenium(url)
        if(type(html)==str):
            self.write(html)
        self.write('error')
def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/data", DataHandler),
        (r"/html",HtmlHandler)
    ], debug=True)


if __name__ == "__main__":
    app = make_app()
    app.listen(8888)  # 监听8888端口
    print("Server is running on http://localhost:8888")
    tornado.ioloop.IOLoop.current().start()
