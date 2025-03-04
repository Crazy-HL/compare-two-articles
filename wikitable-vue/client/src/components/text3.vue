<template>
	<div class="main-container">
		<!-- 聊天容器 -->
		<div class="chat-container">
			<!-- 历史对话记录 -->
			<div class="chat-history">
				<div
					v-for="(message, index) in chatHistory"
					:key="index"
					:class="['message', message.role]">
					<div class="message-content">
						<strong>{{ message.role === "user" ? "用户" : "GPT" }}:</strong>
						<p>{{ message.content }}</p>
					</div>
				</div>
			</div>

			<!-- 输入框和操作按钮 -->
			<div class="input-container">
				<textarea
					v-model="userQuestion"
					rows="2"
					placeholder="请输入你想问的问题..."></textarea>
				<div class="button-container">
					<button @click="askQuestion">发送</button>
					<button @click="compareTexts">对比文章</button>
					<button @click="processText" class="submit-btn">提交可视化</button>
					<!-- 新增提交可视化按钮 -->
				</div>
			</div>
		</div>

		<!-- 视觉内容容器 -->
		<div class="vis-container">
			<!-- 可用于显示图形或其他内容 -->
			<div ref="chart" class="chart-container"></div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted } from "vue";
	import bus from "@/js/eventBus.js";
	import * as d3 from "d3";
	import { toRaw } from "vue";
	import {
		renderLineChart,
		renderBarChart,
		renderPieChart
	} from "@/js/chartUtils";

	const userQuestion = ref(""); // 用户输入的问题
	const chatHistory = ref([]); // 历史对话记录
	const selectText2 = ref(""); // 左侧选中文本
	const selectText3 = ref(""); // 右侧选中文本

	let offDiv1, offDiv3;

	onMounted(() => {
		offDiv1 = bus.on("div1Event", data => {
			console.log("Received data from div1:", data); // 确认是否接收到数据
			handleSelection(data, "div1");
		});
		offDiv3 = bus.on("div3Event", data => handleSelection(data, "div3"));
	});

	onUnmounted(() => {
		offDiv1();
		offDiv3();
	});

	// 处理选中文本
	function handleSelection(data, source) {
		console.log("Received data:", data); // 调试输出接收到的数据
		const plainText = getPlainTextFromSelection(data.content);
		if (source === "div1") {
			selectText2.value = plainText;
		} else if (source === "div3") {
			selectText3.value = plainText;
		}
	}

	// 从 HTML 内容中提取纯文本
	function getPlainTextFromSelection(htmlContent) {
		const container = document.createElement("div");
		container.innerHTML = htmlContent;
		console.log("Extracted text:", container.innerText); // 输出提取的纯文本
		return container.innerText || container.textContent || "";
	}

	// 向 GPT 提问
	async function askQuestion() {
		if (!userQuestion.value) {
			alert("请输入问题！");
			return;
		}

		// 将用户的问题添加到历史记录
		chatHistory.value.push({ role: "user", content: userQuestion.value });

		try {
			const response = await api.post(
				"gpt_ask",
				{ question: userQuestion.value },
				data => {
					if (data) {
						// 将 GPT 的回答添加到历史记录
						chatHistory.value.push({ role: "assistant", content: data.answer });
					} else {
						console.error("提问失败:", data.error);
					}
				}
			);
		} catch (error) {
			console.error("请求失败:", error);
		}

		// 清空输入框
		userQuestion.value = "";
	}

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

	// 提交文章内容并获取处理结果
	async function processText() {
		try {
			const response = await fetch("http://localhost:8888/process_text", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ text: selectText2.value })
			});
			const result = await response.json();

			// 检查是否有错误信息
			if (result.error) {
				console.error("后端返回的错误:", result.error);
				alert(`处理文章内容时出错: ${result.message}`);
				return;
			}

			// 赋值时确保 jsonData 是对象
			const jsonData = result.json_data;
			console.log("后端返回的数据:", jsonData);
			renderChart(jsonData);
		} catch (error) {
			console.error("处理文章内容时出错:", error);
			alert("处理文章内容时出错，请稍后重试");
		}
	}

	// 渲染图表
	function renderChart(rawJsonData) {
		if (!rawJsonData || typeof rawJsonData !== "object" || !rawJsonData.data) {
			console.error("JSON 数据无效:", rawJsonData);
			return;
		}

		// 清空之前的图表
		d3.select(".chart-container").html("");

		const chartType = rawJsonData.type;
		const data = rawJsonData.data;
		const options = rawJsonData.options || {};

		if (chartType === "line") {
			renderLineChart(".chart-container", data, options);
		} else if (chartType === "bar") {
			renderBarChart(".chart-container", data, options);
		} else if (chartType === "pie") {
			renderPieChart(".chart-container", data, options);
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
		width: 800px; /* 固定宽度 */
		height: 100vh;
		margin: 0 auto;
		padding: 5px;
		background-color: #f5f5f5;
	}

	/* 聊天容器 */
	.chat-container {
		display: flex;
		flex-direction: column;
		flex: 1;
		background-color: #ffffff;
		padding: 20px;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		margin-bottom: 5px;
	}

	/* 历史对话记录 */
	.chat-history {
		flex: 1;
		overflow-y: auto;
		max-height: 200px;
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
		/* width: 100%; */
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

	/* 视觉内容容器 */
	.vis-container {
		flex: 1;
		background-color: #ffffff;
		border-radius: 12px;
		border: 1px solid #e0e0e0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		padding: 10px;
	}
	.chart-container {
		width: 100%;
		height: 100%;
	}
</style>
