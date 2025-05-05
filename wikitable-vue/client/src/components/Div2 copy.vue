<template>
	<div class="main-container">
		<div class="chat-container" @dragover.prevent @drop="handleDrop">
			<div class="chat-history">
				<div
					v-for="(message, index) in chatHistory"
					:key="index"
					:class="['message', message.role]">
					<div class="message-content">
						<strong>{{ message.role === "user" ? "用户" : "GPT" }}:</strong>
						<p v-html="message.content"></p>
					</div>
				</div>
			</div>
		</div>

		<div class="vis-container">
			<CompareTable
				class="compare-table"
				:div1-raw-data="div1RawData"
				:div3-raw-data="div3RawData"
				@compareAttribute="handleAttributeComparison" />
		</div>
		<div class="input">
			<div class="input-container">
				<textarea
					v-model="userQuestion"
					rows="2"
					placeholder="请输入你想问的问题..."></textarea>
				<div class="button-container">
					<button @click="askQuestion">发送</button>
					<!-- <button @click="mergedJson">合并数据</button>
					<button @click="compareTexts">对比文本</button> -->
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted } from "vue";
	import bus from "@/js/eventBus.js";
	import CompareTable from "@/components/compoents_base/CompareTable.vue";
	import {
		renderLineChart,
		renderBarChart,
		renderPieChart,
		renderNonVisualChart,
		renderRadarChart,
		renderStackedBarChart,
		renderScatterChart
	} from "@/js/chartUtils";

	const userQuestion = ref("");
	const chatHistory = ref([]);
	const selectText2 = ref("");
	const selectText3 = ref("");
	const currentChartData = ref(null);
	const currentChartType = ref(null);
	const div1RawData = ref(null);
	const div3RawData = ref(null);

	const handleDiv1Event = data => handleSelection(data, "div1");
	const handleDiv3Event = data => handleSelection(data, "div3");

	onMounted(() => {
		bus.on("div1_Event", handleDiv1Event);
		bus.on("div3_Event", handleDiv3Event);
	});

	onUnmounted(() => {
		bus.off("div1_Event", handleDiv1Event);
		bus.off("div3_Event", handleDiv3Event);
	});

	function handleSelection(data, source) {
		const plainText = getPlainTextFromSelection(data.content);
		if (source === "div1") {
			selectText2.value = plainText;
			div1RawData.value = data.content;
		} else if (source === "div3") {
			selectText3.value = plainText;
			div3RawData.value = data.content;
		}
	}

	function getPlainTextFromSelection(htmlContent) {
		const container = document.createElement("div");
		container.innerHTML = htmlContent;
		return container.innerText || container.textContent || "";
	}

	const handleDragStart = event => {
		event.dataTransfer.setData(
			"application/json",
			JSON.stringify({
				chartData: currentChartData.value,
				chartType: currentChartType.value
			})
		);
	};

	const handleDrop = event => {
		event.preventDefault();
		const data = event.dataTransfer.getData("application/json");
		if (data) {
			try {
				const { chartData, chartType } = JSON.parse(data);
				currentChartData.value = chartData;
				currentChartType.value = chartType;
				analyzeChart(chartData, chartType);
			} catch (error) {
				console.error("解析拖拽数据失败:", error);
			}
		}
	};

	const analyzeChart = (chartData, chartType) => {
		api.post(
			"analyze_chart",
			{ chartData, chartType },
			response => {
				if (response && response.analysis) {
					const formattedAnalysis = formatAnalysisResult(response.analysis);
					chatHistory.value.push({
						role: "assistant",
						content: formattedAnalysis
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
				console.error("图表分析失败:", error);
				chatHistory.value.push({
					role: "assistant",
					content: "图表分析失败，请稍后重试。"
				});
			}
		);
	};

	const formatAnalysisResult = text => {
		text = text.replace(/### (.*)/g, "<h3>$1</h3>");
		text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
		text = text.replace(/\n/g, "<br>");
		text = text.replace(/(?:^|\n)(\d+\.\s+.*)/g, "<li>$1</li>");
		text = text.replace(/(?:^|\n)-\s+(.*)/g, "<li>$1</li>");
		text = text.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
		return text;
	};

	const askQuestion = () => {
		if (!userQuestion.value) {
			alert("请输入问题！");
			return;
		}

		chatHistory.value.push({ role: "user", content: userQuestion.value });

		api.post(
			"gpt_ask_chart",
			{
				question: userQuestion.value,
				chartData: currentChartData.value,
				chartType: currentChartType.value
			},
			response => {
				const formattedAnswer = formatAnalysisResult(response.answer);
				chatHistory.value.push({ role: "assistant", content: formattedAnswer });
			},
			error => {
				console.error("请求失败:", error);
				chatHistory.value.push({
					role: "assistant",
					content: "请求失败，请稍后重试。"
				});
			}
		);

		userQuestion.value = "";
	};

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
					if (data.yes_no === "no" || !jsonData) {
						renderNonVisualChart(".chart-container", data, {
							message: "当前数据无法合并"
						});
						return;
					}
					renderChart(jsonData, data.chart_classification);
					bus.emit("updateChart1", {
						divId: "div1",
						jsonData: data.div1_json,
						chartType: data.chart_classification
					});
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

	function renderChart(rawJsonData, chartType) {
		if (!rawJsonData || typeof rawJsonData !== "object") {
			renderNonVisualChart(`.${props.containerClass}`, rawJsonData, {
				message: "JSON 数据无效"
			});
			return;
		}

		const data = rawJsonData.data;
		const options = rawJsonData.options || {};
		const chartContainer = document.querySelector(".chart-container");

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

	const handleAttributeComparison = async ({
		fieldKey,
		leftData,
		rightData,
		leftTitle,
		rightTitle,
		fieldType,
		fieldLabel
	}) => {
		try {
			chatHistory.value.push({
				role: "assistant",
				content: `正在分析 <strong>${leftTitle}</strong> 和 <strong>${rightTitle}</strong> 的 <strong>${fieldKey}</strong> (${fieldLabel}) 数据对比...`
			});

			api.post(
				"analyze_chart",
				{
					chartData: {
						leftData,
						rightData,
						leftTitle,
						rightTitle,
						fieldKey,
						fieldType
					},
					chartType: "comparison"
				},
				response => {
					if (response && response.analysis) {
						const formattedAnalysis = formatAnalysisResult(response.analysis);
						chatHistory.value.push({
							role: "assistant",
							content: formattedAnalysis
						});
					} else {
						throw new Error("无效的响应格式");
					}
				},
				error => {
					throw error;
				}
			);
		} catch (error) {
			console.error("对比分析失败:", error);
			chatHistory.value.push({
				role: "assistant",
				content: `对比分析失败: ${error.message || "未知错误"}`
			});
		}
	};
</script>

<style scoped>
	.main-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100vh;
		margin: 0 auto;
		padding: 5px;
		background-color: #f5f5f5;
	}

	.chat-container {
		flex: 0 0 20%; /* 固定高度占比30% */
		min-height: 200px; /* 最小高度 */
		max-height: 30vh; /* 最大高度 */
		background-color: #ffffff;
		padding: 20px;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
		overflow: hidden; /* 确保内容不会溢出 */
	}

	.chat-history {
		flex: 1;
		overflow-y: auto; /* 内容超出时显示滚动条 */
		padding: 10px;
		background-color: #fafafa;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
		margin-bottom: 20px;
	}

	.input {
		flex: 0.3;
	}

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

	.vis-container {
		flex: 1.2;
		padding: 8px;
		background-color: #ffffff;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		min-width: 320px;
	}

	.compare-table {
		width: 100%;
		height: 100%;
	}

	.input-container {
		display: flex;
		flex: 2;
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
		flex: 0.2;
		justify-content: space-between;
		gap: 10px;
	}

	button {
		flex: 1;
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
</style>
