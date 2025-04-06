<template>
	<div class="main-container">
		<!-- 聊天容器 -->
		<div class="chat-container" @dragover.prevent @drop="handleDrop">
			<!-- 历史对话记录 -->
			<div class="chat-history">
				<div
					v-for="(message, index) in chatHistory"
					:key="index"
					:class="['message', message.role]">
					<div class="message-content">
						<strong>{{ message.role === "user" ? "用户" : "GPT" }}:</strong>
						<p v-html="message.content"></p>
						<!-- 使用 v-html 渲染 HTML 内容 -->
					</div>
				</div>
			</div>
		</div>

		<!-- 视觉内容容器 -->
		<div class="vis-container">
			<CompareTable :div1-raw-data="div1RawData" :div3-raw-data="div3RawData" />

			<!-- 输入框和操作按钮 -->
			<div class="input-container">
				<textarea
					v-model="userQuestion"
					rows="2"
					placeholder="请输入你想问的问题..."></textarea>
				<div class="button-container">
					<button @click="askQuestion">发送</button>
					<!-- <button @click="compareTexts">对比文章</button> -->
					<!-- <button @click="compareTexts" class="submit-btn">
						合并数据可视化
					</button> -->
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted } from "vue";
	import bus from "@/js/eventBus.js";
	import CompareTable from "@/components/compoents_base/CompareTable.vue";
	import * as d3 from "d3";
	import {
		renderLineChart,
		renderBarChart,
		renderPieChart,
		renderNonVisualChart,
		renderRadarChart,
		renderStackedBarChart,
		renderScatterChart
	} from "@/js/chartUtils";

	const userQuestion = ref(""); // 用户输入的问题
	const chatHistory = ref([]); // 历史对话记录
	const selectText2 = ref(""); // 左侧选中文本
	const selectText3 = ref(""); // 右侧选中文本
	const currentChartData = ref(null); // 当前图表数据
	const currentChartType = ref(null); // 当前图表类型
	const div1RawData = ref(null);
	const div3RawData = ref(null);

	// 定义回调函数
	const handleDiv1Event = data => handleSelection(data, "div1");
	const handleDiv3Event = data => handleSelection(data, "div3");

	onMounted(() => {
		bus.on("div1_Event", handleDiv1Event);
		bus.on("div3_Event", handleDiv3Event);
	});

	onUnmounted(() => {
		// 解绑事件
		bus.off("div1_Event", handleDiv1Event);
		bus.off("div3_Event", handleDiv3Event);
	});

	// 处理选中文本
	function handleSelection(data, source) {
		console.log("Received data:", data); // 调试输出接收到的数据
		const plainText = getPlainTextFromSelection(data.content);
		if (source === "div1") {
			selectText2.value = plainText;
			div1RawData.value = data.content; // 直接传递原始HTML
		} else if (source === "div3") {
			selectText3.value = plainText;
			div3RawData.value = data.content; // 直接传递原始HTML
		}
	}

	// 从 HTML 内容中提取纯文本
	function getPlainTextFromSelection(htmlContent) {
		const container = document.createElement("div");
		container.innerHTML = htmlContent;
		console.log("Extracted text:", container.innerText); // 输出提取的纯文本
		return container.innerText || container.textContent || "";
	}

	// 处理拖拽开始事件
	const handleDragStart = event => {
		// 将图表数据传递给拖拽事件
		event.dataTransfer.setData(
			"application/json",
			JSON.stringify({
				chartData: currentChartData.value,
				chartType: currentChartType.value
			})
		);
		console.log("拖拽数据已设置:", currentChartData.value); // 调试日志
	};

	// 处理拖拽释放事件
	const handleDrop = event => {
		event.preventDefault();
		const data = event.dataTransfer.getData("application/json");
		console.log("接收到的拖拽数据:", data); // 调试日志

		if (data) {
			try {
				const { chartData, chartType } = JSON.parse(data);
				console.log("解析后的图表数据:", chartData); // 调试日志
				console.log("解析后的图表类型:", chartType); // 调试日志

				currentChartData.value = chartData;
				currentChartType.value = chartType;
				analyzeChart(chartData, chartType); // 调用大模型分析图表
			} catch (error) {
				console.error("解析拖拽数据失败:", error);
			}
		} else {
			console.error("未接收到拖拽数据");
		}
	};

	// 分析图表
	const analyzeChart = (chartData, chartType) => {
		console.log("正在调用后端接口..."); // 调试日志

		// 调用大模型分析图表
		api.post(
			"analyze_chart",
			{ chartData, chartType },
			response => {
				console.log("后端接口返回的数据:", response); // 调试日志

				// 检查 response 是否存在且包含 analysis 字段
				if (response && response.analysis) {
					// 格式化分析结果
					const formattedAnalysis = formatAnalysisResult(response.analysis);

					// 将分析结果添加到聊天记录
					chatHistory.value.push({
						role: "assistant",
						content: formattedAnalysis // 使用格式化后的 HTML 内容
					});
				} else {
					console.error("后端返回的数据格式不正确:", response);
					chatHistory.value.push({
						role: "assistant",
						content: "图表分析失败，后端返回的数据格式不正确。"
					});
				}
			},
			error => {
				// 处理错误
				console.error("图表分析失败:", error);
				chatHistory.value.push({
					role: "assistant",
					content: "图表分析失败，请稍后重试。"
				});
			}
		);
	};

	const formatAnalysisResult = text => {
		// 转换 Markdown 标题
		text = text.replace(/### (.*)/g, "<h3>$1</h3>");

		// 转换加粗文本
		text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

		// 处理换行符
		text = text.replace(/\n/g, "<br>");

		// 处理列表项（数字编号和短横线）
		text = text.replace(/(?:^|\n)(\d+\.\s+.*)/g, "<li>$1</li>");
		text = text.replace(/(?:^|\n)-\s+(.*)/g, "<li>$1</li>");

		// 统一包裹列表项
		text = text.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

		return text;
	};

	// 向 GPT 提问
	const askQuestion = () => {
		if (!userQuestion.value) {
			alert("请输入问题！");
			return;
		}

		// 将用户的问题添加到历史记录
		chatHistory.value.push({ role: "user", content: userQuestion.value });

		// 调用 GPT 提问接口
		api.post(
			"gpt_ask_chart",
			{
				question: userQuestion.value,
				chartData: currentChartData.value,
				chartType: currentChartType.value
			},
			response => {
				// 成功回调
				console.log("后端接口返回的数据:", response); // 调试日志

				// 格式化 GPT 的回答
				const formattedAnswer = formatAnalysisResult(response.answer);

				// 将 GPT 的回答添加到历史记录
				chatHistory.value.push({ role: "assistant", content: formattedAnswer });
			},
			error => {
				// 错误回调
				console.error("请求失败:", error);
				chatHistory.value.push({
					role: "assistant",
					content: "请求失败，请稍后重试。"
				});
			}
		);

		// 清空输入框
		userQuestion.value = "";
	};

	// 对比文章
	async function compareTexts() {
		if (!selectText2.value || !selectText3.value) {
			alert("请先选择两段文本！");
			return;
		}

		try {
			api.post(
				"gpt_compare",
				{ text1: selectText2.value, text2: selectText3.value },
				data => {
					if (data) {
						// 将对比结果添加到历史记录
						chatHistory.value.push({ role: "assistant", content: data.result });
					} else {
						console.error("对比失败:", data.error);
					}
				}
			);
		} catch (error) {
			console.error("请求失败:", error);
		}
	}

	// 合并数据
	async function mergedJson() {
		if (!selectText2.value || !selectText3.value) {
			alert("请先选择两段文本！");
			return;
		}

		try {
			api.post(
				"merged_json",
				{ text1: selectText2.value, text2: selectText3.value },
				data => {
					if (data.error) {
						console.error("后端返回的错误:", data.error);
						alert(`处理文章内容时出错: ${data.message}`);
						return;
					}

					const jsonData = data.json_data;
					currentChartData.value = jsonData;
					currentChartType.value = data.chart_classification;
					console.log("后端返回的数据:", jsonData);
					if (data.yes_no === "no" || !jsonData) {
						renderNonVisualChart(".chart-container", data, {
							message: "当前数据无法合并"
						});
						return;
					}
					renderChart(jsonData, data.chart_classification);
					// 通过事件总线将 Div1 和 Div3 的 JSON 数据传递给 TextPopup.vue
					console.log("触发 updateChart1 事件");
					bus.emit("updateChart1", {
						divId: "div1",
						jsonData: data.div1_json,
						chartType: data.chart_classification
					});
					console.log("触发 updateChart3 事件");
					bus.emit("updateChart3", {
						divId: "div3",
						jsonData: data.div3_json,
						chartType: data.chart_classification
					});
				}
			);
		} catch (error) {
			console.error("处理JSON时出错:", error);
			alert("处理JSON时出错，请稍后重试");
		}
	}

	// 渲染图表
	function renderChart(rawJsonData, chartType) {
		if (!rawJsonData || typeof rawJsonData !== "object") {
			console.log("rawJsonData:", rawJsonData);
			console.log("type_rawJsonData:", typeof rawJsonData);
			renderNonVisualChart(`.${props.containerClass}`, rawJsonData, {
				message: "JSON 数据无效"
			});
			console.error("JSON 数据无效:", rawJsonData);
			return;
		}

		const data = rawJsonData.data;
		const options = rawJsonData.options || {};
		// 获取 chart-container 的 DOM 元素
		const chartContainer = document.querySelector(".chart-container");

		// 根据图表类型渲染
		if (chartType === "Line Chart") {
			renderLineChart(chartContainer, data, options);
		} else if (chartType === "Bar Chart") {
			renderBarChart(chartContainer, rawJsonData);
		} else if (chartType === "Pie Chart") {
			renderPieChart(chartContainer, data, options);
		} else if (chartType === "Stacked Bar Chart") {
			renderStackedBarChart(chartContainer, data, options);
		} else if (chartType === "Radar Chart") {
			renderRadarChart(chartContainer, rawJsonData);
		} else if (chartType === "Scatter Chart") {
			renderScatterChart(chartContainer, rawJsonData);
		} else {
			console.error("未知的图表类型:", chartType);
		}
	}
</script>

<style scoped>
	/* 主容器 */
	.main-container {
		display: flex;
		flex-direction: column;
		width: 100%; /* 固定宽度 */
		height: 100vh;
		margin: 0 auto;
		padding: 5px;
		background-color: #f5f5f5;
	}

	/* 聊天容器 */
	.chat-container {
		flex: 0.5;
		background-color: #ffffff;
		padding: 20px;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		margin-bottom: 10px;
	}

	/* 历史对话记录 */
	.chat-history {
		flex: 0.5;
		overflow-y: auto;
		height: 95%;
		/* max-height: 200px; */
		padding: 10px;
		background-color: #fafafa;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
		margin-bottom: 20px;
	}

	/* 消息样式 */
	.message {
		margin-bottom: 15px;
	}

	.message-content {
		padding: 12px;
		border-radius: 8px;
		background-color: #f0f0f0;
		line-height: 1.5;
	}

	.message.user .message-content {
		background-color: #e3f2fd;
		text-align: right;
	}

	.message.assistant .message-content {
		background-color: #f5f5f5;
		text-align: left;
	}

	/* 分析结果的样式 */
	.message-content p {
		font-family: Arial, sans-serif;
		line-height: 1.6;
		color: #333;
	}

	.message-content h3 {
		font-size: 1.2em;
		font-weight: bold;
		margin: 10px 0;
		color: #0077b6;
	}

	.message-content strong {
		font-weight: bold;
		color: #d90429;
	}

	.message-content ul {
		margin: 10px 0;
		padding-left: 20px;
	}

	.message-content li {
		margin-bottom: 5px;
	}

	.message-content br {
		display: block;
		margin: 10px 0;
	}
	/* 视觉内容容器 */
	.vis-container {
		flex: 1;
		background-color: #ffffff;
		border-radius: 12px;
		border: 1px solid #e0e0e0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.chart-container {
		flex: 1;
		width: 100%;
		height: 100%;
	}

	/* 输入框和按钮容器 */
	.input-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	textarea {
		width: 100%;
		height: 80px;
		resize: none;
		padding: 12px;
		font-size: 14px;
		border: 1px solid #ddd;
		border-radius: 8px;
		background-color: #fafafa;
		transition: border-color 0.3s ease;
	}

	textarea:focus {
		outline: none;
		border-color: #4caf50;
	}

	.button-container {
		display: flex;
		justify-content: space-between;
		gap: 10px;
	}

	button {
		flex: 1; /* 按钮宽度占满容器 */
		padding: 10px 20px;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		transition: background-color 0.3s ease;
	}

	button:hover {
		background-color: #45a049;
	}

	button:active {
		background-color: #3d8b40;
	}

	/* 新增提交按钮样式 */
	.submit-btn {
		background-color: #ff9800;
	}

	.submit-btn:hover {
		background-color: #fb8c00;
	}

	.submit-btn:active {
		background-color: #f57c00;
	}
</style>
