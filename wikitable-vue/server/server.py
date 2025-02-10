# app.py
import tornado.ioloop
import tornado.web
import json
from tool.obtainHtml import obtain_html


from openai import OpenAI

class GPTCompareHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")

    def options(self):
        self.set_status(204)
        self.finish()

    def post(self):
        try:
            data = json.loads(self.request.body)
            text1 = data.get("text1")
            text2 = data.get("text2")
            print(text1 + text2)
            client = OpenAI(
                api_key="sk-DpMfYrwYZtjzzpfQfdrZRt4kfL9G4HeHDeOTYEXl2RecgN6y", 
                base_url="https://api.moonshot.cn/v1",
            )

            completion = client.chat.completions.create(
                model="moonshot-v1-8k",
                messages=[
                    {"role": "system", "content": "你是一个文章对比专家，能够帮助用户对比两篇文章的内容。"},
                    {"role": "user", "content": f"请对比以下两篇文章的内容：\n文章1:\n{text1}\n文章2:\n{text2}"},
                ],
                temperature=0.3,
            )

            result = completion.choices[0].message.content
            # 通过 API 我们获得了 Kimi 大模型给予我们的回复消息（role=assistant）
            print(completion.choices[0].message.content)
            self.write(json.dumps({"result": result}))
        except Exception as e:
            self.write(json.dumps({"error": str(e)}))
            
# class GPTCompareHandler(tornado.web.RequestHandler):
#     def set_default_headers(self):
#         self.set_header("Access-Control-Allow-Origin", "*")
#         self.set_header("Access-Control-Allow-Headers", "Content-Type")
#         # self.set_header("Access-Control-Allow-Methods", "POST, OPTIONS")

#     def get(self):
#         try:
#             # data = json.loads(self.request.body)
#             text1 = self.get_argument('text1')
#             text2 = self.get_argument('text2')
#             print(text1 + text2)
#             client = OpenAI(
#                 api_key="sk-DpMfYrwYZtjzzpfQfdrZRt4kfL9G4HeHDeOTYEXl2RecgN6y",  # 在这里将 MOONSHOT_API_KEY 替换为你从 Kimi 开放平台申请的 API Key
#                 base_url="https://api.moonshot.cn/v1",
#             )

#             completion = client.chat.completions.create(
#                 model="moonshot-v1-8k",
#                 messages=[
#                     {"role": "system", "content": "你是一个文章对比专家，能够帮助用户对比两篇文章的内容。"},
#                     {"role": "user", "content": f"请对比以下两篇文章的内容：\n文章1:\n{text1}\n文章2:\n{text2}"},
#                 ],
#                 temperature=0.3,
#             )

#             result = completion.choices[0].message.content
#             # 通过 API 我们获得了 Kimi 大模型给予我们的回复消息（role=assistant）
#             print(completion.choices[0].message.content)
#             self.write(json.dumps({"result": result}))
#         except Exception as e:
#             self.write(json.dumps({"error": str(e)}))


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
        (r"/html",HtmlHandler),
        (r"/gpt_compare", GPTCompareHandler)

    ], debug=True)


if __name__ == "__main__":
    app = make_app()
    app.listen(8888)  # 监听8888端口
    print("Server is running on http://localhost:8888")
    tornado.ioloop.IOLoop.current().start()
