import time
import tornado.ioloop
import tornado.web
import json
from openai import OpenAI
from tool.obtainHtml import obtain_html
from tool.chart_formats import (
    get_bar_chart_format,
    get_pie_chart_format,
    get_line_chart_format,
    get_horizontal_bar_chart_format,
    get_histogram_format,
    get_stacked_bar_chart_format,
    get_scatter_plot_format,
    get_radar_chart_format
)
from tool.json_extractor import extract_json


# 初始化 OpenAI 客户端
client = OpenAI(
    api_key="sk-TP5irJaHr4BnF5FMSzmGh1dHDX7xWWIzwHY7QordRTvfo9UD", 
    base_url="https://api.moonshot.cn/v1",
)

# 系统消息，用于为模型提供指导
system_messages = [
    {"role": "system", "content": "你是辅助阅读对比的专家，可以对比两篇文章。同时你还可以判断文章中的内容是否可以进行可视化，并擅长将相关的可视化数据识别提取出来。"},
]

# 用于记录对比结果
comparison_result = ""  # 对比后的文章内容

def make_messages(input: str, n: int = 20) -> list:
    """
    构造消息列表，用于每次请求的消息传递。保留最新的 n 条消息，并确保系统消息始终在列表中。
    """
    # 先将用户的最新问题添加到历史记录
    messages = [{
        "role": "user",
        "content": input,  
    }]
    
    # 构建新的消息列表
    new_messages = []
    new_messages.extend(system_messages)  # 添加系统消息
    
    # 保证不超过 n 条历史记录
    if len(messages) > n:
        messages = messages[-n:]
    
    new_messages.extend(messages)  # 添加历史消息
    return new_messages

def chat(input: str) -> str:
    """
    进行对话，并返回模型的回答，支持多轮对话。
    """
    retry_attempts = 3
    for attempt in range(retry_attempts):
        try:
            completion = client.chat.completions.create(
                model="moonshot-v1-8k",
                messages=make_messages(input),
                temperature=0.3,
            )

            # 获取模型的回答并返回
            assistant_message = completion.choices[0].message
            return assistant_message.content
        except Exception as e:
            if "rate_limit_reached_error" in str(e):
                print(f"Rate limit reached, retrying in 30 seconds... (Attempt {attempt+1}/{retry_attempts})")
                time.sleep(30)  # 等待 30 秒后重试
            else:
                print(f"Error occurred: {str(e)}")
                break
    return json.dumps({
        "error": "OpenAI API 调用失败",
        "message": "请检查 API 配置或稍后重试"
    })

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
            print("Comparing text 1 and text 2")

            # 对比文章的逻辑
            global comparison_result
            comparison_result = chat(f"请对比以下两篇文章的内容：\n文章1:\n{text1}\n文章2:\n{text2}")
            print(f"对比结果：{comparison_result}")
            self.write(json.dumps({"result": comparison_result}))
        except Exception as e:
            self.write(json.dumps({
                "error": str(e),
                "message": "对比文章时出错"
            }))

class GPTAskHandler(tornado.web.RequestHandler):
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
            question = data.get("question")
            global comparison_result  # 获取对比结果
            print(f"用户问题: {question}, 上下文: {comparison_result}")
            
            # 使用对比结果和用户问题进行对话
            conversation_input = f"以下是文章对比结果：\n{comparison_result}\n用户提问：\n{question}"
            answer = chat(conversation_input)  # 获取 GPT 的回答
            self.write(json.dumps({"answer": answer}))
        except Exception as e:
            self.write(json.dumps({
                "error": str(e),
                "message": "提问时出错"
            }))


class MergedJsonsHandler(tornado.web.RequestHandler):
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
            # yes_no = chat(f"""
            #                      帮我分别判断{text1}和{text2}的内容是否适合将数据提取出来进行可视化，如果有一个不适合则返回“no”，否则返回“yes”。
            #                      **预期输出**: 您的响应应该是列表["yes","no"]中的单个单词，不带任何额外的解释或理由。""")
            
            # if yes_no == 'no':
            #     # 直接返回结果，不执行后续代码
            #     self.write(json.dumps({
            #         "data_classification": "",
            #         "json_data": "",
            #         "yes_no":"no"
            #     }))
            #     return
            suitable_charts = ["Line Chart","Scatter Chart","Bar Chart","Stacked Bar Chart"]
            chart_classification = chat(f"""
            从以下列表中{suitable_charts}选择一个最适合{text1}可视化的图表类型，同时也适合{text2}可视化的图表类型。
            预期输出: 你的响应应该是以下列表中的一个单词{suitable_charts}，不需要额外的解释或理由。
            """)
            chart_classification = chart_classification.strip()
            print("chart_classification：", chart_classification)

            # 根据不同的图表类型，选择对应的 JSON 格式
            if chart_classification == "Bar Chart":
                json_format = get_bar_chart_format()
            elif chart_classification == "Pie Chart":
                json_format = get_pie_chart_format()
            elif chart_classification == "Line Chart":
                json_format = get_line_chart_format()
            elif chart_classification == "Horizontal Bar Chart":
                json_format = get_horizontal_bar_chart_format()
            elif chart_classification == "Histogram":
                json_format = get_histogram_format()
            elif chart_classification == "Stacked Bar Chart":
                json_format = get_stacked_bar_chart_format()
            elif chart_classification == "Scatter Chart":
                json_format = get_scatter_plot_format()
            elif chart_classification == "Radar Chart":
                json_format = get_radar_chart_format()
            else:
                json_format = []

            # 提取数据并转换成标准 JSON 格式
            json1_data = chat(f"""
            将{text1}可视化为{chart_classification}所需的数据提取出来，提取的数据一定要完整且合理，如果是表格数据，则应该将全部数据都提取出来，不要删减。如果数据值为0，请不要省略。按照下面举例的 JSON 格式输出（内容需要自行分析，要符合提取的数据内容）：{json_format}
            预期输出: 你的响应应该是一个由花括号包裹的 JSON 格式的数据，该数据要符合规范
            （例如：1、不要添加\减少括号或逗号等；
            2、属性值要正确等；3、不要添加任何额外的解释或理由），
            同时花括号外也不带任何额外的解释或理由，同时数据中的非数值应该被替换为0（例如null、undefind等）。
            """)
            json2_data = chat(f"""
            将{text2}可视化为{chart_classification}所需的数据提取出来，提取的数据一定要完整且合理，如果是表格数据，则应该将全部数据都提取出来，不要删减。如果数据值为0，请不要省略。按照下面举例的 JSON 格式输出（内容需要自行分析，要符合提取的数据内容）：{json_format}
            预期输出: 你的响应应该是一个由花括号包裹的 JSON 格式的数据，该数据要符合规范
            （例如：1、不要添加\减少括号或逗号等；
            2、属性值要正确等；3、不要添加任何额外的解释或理由），
            同时花括号外也不带任何额外的解释或理由，同时数据中的非数值应该被替换为0（例如null、undefind等）。
            """)
            # 调用函数提取 JSON 数据
            json1_data = extract_json(json1_data)
            json2_data = extract_json(json2_data)
            #合并json数据
            json_data = chat(f"""
            帮我将{json1_data}和{json2_data}两个JSON数据合并，要求合并数据必须包含了这两个JSON数据的所有数据，并且合并后的JSON格式与这两个JSON数据相同。
            预期输出: 你的响应应该是一个由花括号包裹的 JSON 格式的数据，该数据要符合规范
            （例如：1、不要添加\减少括号或逗号等；
            2、属性值要正确等；3、不要添加任何额外的解释或理由），
            同时花括号外也不带任何额外的解释或理由，同时数据中的非数值应该被替换为0（例如null、undefind等）。""")
            # 调用函数提取 JSON 数据
            json_data = extract_json(json_data)
            print("json1:",json1_data)
            print("json2:",json2_data)
            print("json:",json_data)
            # 返回结果
            self.write(json.dumps({
                "chart_classification": chart_classification,
                "json_data": json_data,
                "div1_json": json1_data,
                "div3_json": json2_data,
                "yes_no":"yes"
            }))
        except Exception as e:
            # 捕获所有异常并返回 JSON 格式的错误信息
            self.write(json.dumps({
                "error": str(e),
                "message": "处理文章内容时出错"
            }))

class ProcessTextHandler(tornado.web.RequestHandler):
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
            text = data.get("text")

            # 判断文本类型
            data_type = chat(f"""
                            将以下内容'{text}'按照以下三个类别进行分类，同时判断逻辑为先判断该内容中是否有数据可以进行可视化，如果有则不考虑下方的非可视化数据（Non-Visual Data）这一类别，否则则最后考虑这一类别：
                            1、段落数据（Paragraph Data）：指在文本段落中散布的、可以用图表形式表现的数据信息，如统计数字、比例、趋势描述等。这些数据通常以自然语言的形式出现，但包含具体的数值或可量化的信息。
                            **示例**：统计数字（如“47分”）、比例（如“吸引了6,300名观众，几乎占格伦斯福尔斯14,354人口的一半”）、趋势描述（如“连续第二年晋级NCAA锦标赛第二轮”）。
                            2、表格数据（Tabular Data）：指以表格形式呈现的数据，通常包括行和列，用于系统地展示数值型或分类数据，便于分析和比较。表格数据可以直接用于生成图表。
                            **示例**：数据表（如球员的得分、篮板、助攻等统计）、时间序列数据（如不同日期的比赛得分）。
                            3、非可视化数据（Non-Visual Data）：指不适合或无法通过图表形式展示的数据，例如文本描述、理论概念、个人意见或主观评价等。这类数据通常需要通过文字或叙述来传达其意义。
                            **示例**：文本描述（如“弗雷戴特成为了‘流行文化传奇’”）、理论概念（如“Jimmermania”）、个人意见或主观评价（如“总统奥巴马评价他：‘难以置信。他是全国最好的得分手。很有天赋。’”）。
                            **预期输出**: 您的响应应该是列表["Paragraph","Tabular","Non-Visual"]中的单个单词，不带任何额外的解释或理由。""")
            data_type = data_type.strip()
            print("data_type:", data_type)

            if data_type == 'Non-Visual':
                # 直接返回结果，不执行后续代码
                self.write(json.dumps({
                    "data_type": data_type,
                    "data_classification": "",
                    "json_data": ""
                }))
                return

            # 数据分类
            data_classification = chat(f"""
            根据以下数据类别对{text}进行分类：
            - 数值(Value): 表示可以量化的数值数据，如金额、数量、温度等。
            - 比例(Proportional): 表示各部分在整体中的占比，如百分比、比率等。
            - 分类(Categorical): 不涉及数值，只是对不同类别的区分。
            - 分布(Distribution): 展示数据在各个范围内的分布情况，如频率分布、数据集中趋势等。
            - 对比(Comparison): 用于对比不同组之间的差异。
            - 关系(Relational): 用于展示不同变量之间的相互关系或相关性。
            - 趋势(Trend): 表示数据随时间的变化趋势，如销售额随时间的变化。
            预期输出: 你的响应应该是以下列表中的一个单词 ["Value", "Proportional", "Categorical", "Distribution", "Comparison", "Relational", "Trend"]，不需要额外的解释或理由。""")
            data_classification = data_classification.strip()
            print("data_classification:", data_classification)

            # 根据分类判断合适的可视化类型
            if data_classification == "Value":
                suitable_charts = ["Line Chart"]
            elif data_classification == "Proportional":
                suitable_charts = ["Line Chart","Scatter Chart"]
            elif data_classification == "Categorical":
                suitable_charts = ["Bar Chart"]
            elif data_classification == "Distribution":
                suitable_charts = ["Histogram"]
            elif data_classification == "Comparison":
                suitable_charts = ["Bar Chart", "Stacked Bar Chart", "Line Chart"]
            elif data_classification == "Relational":
                suitable_charts = ["Scatter Chart"]
            elif data_classification == "Trend":
                suitable_charts = ["Line Chart"]
            else:
                suitable_charts = []

            # 判断适合的图表类型
            chart_classification = chat(f"""
            从以下列表中{suitable_charts}选择一个最适合{text}可视化的图表类型。
            预期输出: 你的响应应该是以下列表中的一个单词{suitable_charts}，不需要额外的解释或理由。
            """)
            chart_classification = chart_classification.strip()
            print("chart_classification：", chart_classification)

            # 根据不同的图表类型，选择对应的 JSON 格式
            if chart_classification == "Bar Chart":
                json_format = get_bar_chart_format()
            elif chart_classification == "Pie Chart":
                json_format = get_pie_chart_format()
            elif chart_classification == "Line Chart":
                json_format = get_line_chart_format()
            elif chart_classification == "Horizontal Bar Chart":
                json_format = get_horizontal_bar_chart_format()
            elif chart_classification == "Histogram":
                json_format = get_histogram_format()
            elif chart_classification == "Stacked Bar Chart":
                json_format = get_stacked_bar_chart_format()
            elif chart_classification == "Scatter Chart":
                json_format = get_scatter_plot_format()
                print("format:",json_format)
            elif chart_classification == "Radar Chart":
                json_format = get_radar_chart_format()
            else:
                json_format = []

            # 提取数据并转换成标准 JSON 格式
            json_data = chat(f"""
            将{text}可视化为{chart_classification}所需的数据提取出来，尽可能提取的数据完整，按照下面举例的 JSON 格式输出（内容需要自行分析，要符合提取的数据内容）：{json_format}
            预期输出: 你的响应应该是一个由花括号包裹的 JSON 格式的数据，该数据要符合规范
            （例如：1、不要添加\减少括号或逗号等；
            2、属性值要正确等；3、不要添加任何额外的解释或理由），
            同时花括号外也不带任何额外的解释或理由，同时数据中的非数值应该被替换为0（例如null、undefind等）。
            """)
            print('classification:',chart_classification)
            print("format:",json_format)
            print("###:",json_data)
            # 调用函数提取 JSON 数据
            json_data = extract_json(json_data)
            print("json_data:",json_data)

            # 返回结果
            self.write(json.dumps({
                "data_type": data_type,
                "chart_classification": chart_classification,
                "json_data": json_data
            }))
        except Exception as e:
            # 捕获所有异常并返回 JSON 格式的错误信息
            self.write(json.dumps({
                "error": str(e),
                "message": "处理文章内容时出错"
            }))

class MainHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")

    def get(self):
        self.write("Welcome to the Tornado Server!")

class HtmlHandler(tornado.web.RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "Content-Type")

    def get(self):
        url = self.get_argument('url')
        html = obtain_html(url)  # 获取 HTML 内容
        if(type(html) == str):
            self.write(html)
        self.write('error')

def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/html", HtmlHandler),
        (r"/gpt_compare", GPTCompareHandler),  # 对比文章接口
        (r"/gpt_ask", GPTAskHandler),  # 提问接口
        (r"/process_text", ProcessTextHandler),  # 新增的处理文章内容接口
        (r"/merged_json",MergedJsonsHandler), #合并json数据
    ], debug=True)

if __name__ == "__main__":
    app = make_app()
    app.listen(8888)  # 监听8888端口
    print("Server is running on http://localhost:8888")
    tornado.ioloop.IOLoop.current().start()