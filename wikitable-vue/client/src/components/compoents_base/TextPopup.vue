<template>
	<!-- 遮罩层 -->
	<div v-if="visible" class="overlay" @click="close"></div>

	<!-- 弹出框 -->
	<div v-if="visible" class="text-popup" @click.stop>
		<!-- 切换视图按钮 -->
		<div class="view-switcher">
			<button
				@click.prevent.stop="switchView('text')"
				:class="{ active: currentView === 'text' }"
				title="文本视图">
				<font-awesome-icon :icon="['fas', 'align-left']" />
			</button>

			<button
				@click.prevent.stop="switchView('visual')"
				:class="{ active: currentView === 'visual' }"
				title="可视化视图">
				<font-awesome-icon :icon="['fas', 'chart-bar']" />
			</button>
		</div>

		<!-- 文本视图 -->
		<div v-show="currentView === 'text'">
			<div v-if="isTable" class="table-container" v-html="content"></div>
			<div v-else>
				<p>{{ content }}</p>
			</div>
		</div>

		<!-- 可视化视图 -->
		<div v-show="currentView === 'visual'" class="visualization-container">
			<div v-if="loading" class="loading-spinner"></div>
			<div v-else :class="containerClass"></div>
		</div>
	</div>
</template>

<script setup>
	import { ref, computed, onMounted, onUnmounted } from "vue";
	import * as d3 from "d3";
	import bus from "@/js/eventBus.js";
	import {
		renderLineChart,
		renderBarChart,
		renderPieChart,
		renderNonVisualChart,
		renderRadarChart,
		renderStackedBarChart,
		renderScatterChart
	} from "@/js/chartUtils";

	const props = defineProps({
		visible: Boolean, // 是否显示弹出框
		content: String, // 弹出框内容
		containerClass: String, // 图表容器类名
		containerRef: String
	});

	const emit = defineEmits(["close"]); // 定义 close 事件

	const currentView = ref("text"); // 当前视图模式：text 或 visual
	const loading = ref(false); // 可视化图表加载状态
	const isChartRendered = ref(false); // 标记图表是否已经渲染
	const cachedChartData = ref(null); // 缓存图表数据
	const cachedChartType = ref(null); // 缓存图表类型

	// 判断内容是否是表格
	const isTable = computed(() => {
		return /<table.*?>.*?<\/table>/s.test(props.content);
	});

	// 关闭弹出框
	const close = () => {
		// 清除图表
		d3.select(`.${props.containerClass}`).html("");
		isChartRendered.value = false; // 重置图表渲染状态
		cachedChartData.value = null; // 清除缓存数据
		cachedChartType.value = null; // 清除缓存类型
		emit("close");
	};

	// 切换视图
	const switchView = async view => {
		currentView.value = view;
		if (view === "visual") {
			if (!isChartRendered.value) {
				// 如果图表未渲染，则触发渲染
				loading.value = true;
				await processText();
				loading.value = false;
				isChartRendered.value = true; // 标记图表已渲染
			} else if (cachedChartData.value && cachedChartType.value) {
				// 如果图表已渲染且有缓存数据，则直接使用缓存数据重新渲染
				renderChart(cachedChartData.value, cachedChartType.value);
			}
		}
	};

	// 获取可视化 JSON 数据
	async function processText() {
		try {
			api.post(
				"process_text",
				{ text: props.content.toString().trim() },
				data => {
					if (data.error) {
						console.error("后端返回的错误:", data.error);
						alert(`处理文章内容时出错: ${data.message}`);
						return;
					}

					const jsonData = data.json_data;
					console.log("后端返回的数据:", jsonData);

					// 缓存图表数据和类型
					cachedChartData.value = jsonData;
					cachedChartType.value = data.chart_classification;

					// 清空之前的图表
					d3.select(`.${props.containerClass}`).html("");

					if (data.data_type === "Non-Visual") {
						renderNonVisualChart(`.${props.containerClass}`, data, {
							message: "当前数据无法可视化"
						});
					} else {
						renderChart(jsonData, data.chart_classification);
					}
				}
			);
		} catch (error) {
			console.error("处理文章内容时出错:", error);
			alert("处理文章内容时出错，请稍后重试");
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
		console.log("***data:", data);

		// 根据图表类型渲染
		if (chartType === "Line Chart") {
			renderLineChart(`.${props.containerClass}`, data, options);
		} else if (chartType === "Bar Chart") {
			renderBarChart(`.${props.containerClass}`, rawJsonData);
		} else if (chartType === "Pie Chart") {
			renderPieChart(`.${props.containerClass}`, data, options);
		} else if (chartType === "Stacked Bar Chart") {
			renderStackedBarChart(`.${props.containerClass}`, data, options);
		} else if (chartType === "Radar Chart") {
			renderRadarChart(`.${props.containerClass}`, rawJsonData);
		} else if (chartType === "Scatter Chart") {
			renderScatterChart(`.${props.containerClass}`, rawJsonData);
		} else {
			console.error("未知的图表类型:", chartType);
		}
	}

	// 监听 updateChart 事件
	onMounted(() => {
		bus.on("updateChart1", data => {
			console.log("data1:", data);
			// 清空之前的图表
			d3.select(`.${props.containerClass}`).html("");
			renderChart(data.jsonData, data.chartType);
			isChartRendered.value = true; // 标记图表已渲染
			cachedChartData.value = data.jsonData; // 缓存图表数据
			cachedChartType.value = data.chartType; // 缓存图表类型
		});
		bus.on("updateChart3", data => {
			console.log("data3:", data);
			// 清空之前的图表
			d3.select(`.${props.containerClass}`).html("");
			renderChart(data.jsonData, data.chartType);
			isChartRendered.value = true; // 标记图表已渲染
			cachedChartData.value = data.jsonData; // 缓存图表数据
			cachedChartType.value = data.chartType; // 缓存图表类型
		});
	});

	// 组件卸载时清除事件监听器
	onUnmounted(() => {
		bus.off("updateChart1");
		bus.off("updateChart3");
	});
</script>
<style scoped>
	/* 遮罩层（固定在 Div1 或 Div3 内部） */ /* 遮罩层（固定在 Div1 或 Div3 内部） */
	.overlay {
		position: absolute; /* 关键：相对于父容器定位 */
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.1); /* 半透明背景 */
		backdrop-filter: blur(10px); /* 背景模糊效果 */
		z-index: 90;
		animation: fadeIn 0.3s ease-in-out;
	}

	/* 选中内容的弹出框（固定在 Div1 或 Div3 内部） */
	.text-popup {
		position: absolute; /* 关键：相对于父容器定位 */
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%; /* 宽度占 Div1 或 Div3 的 80% */
		max-height: 80vh; /* 限制最大高度 */
		overflow: auto; /* 添加滚动条 */
		background: rgba(255, 255, 255, 0.98); /* 更亮的背景 */
		padding: 25px; /* 增加内边距 */
		box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.4); /* 更明显的阴影 */
		border-radius: 12px; /* 圆角更大 */
		text-align: center;
		font-size: 0.8vw; /* 固定字体大小 */
		font-weight: 500; /* 中等字体粗细 */
		line-height: 1.6; /* 增加行高 */
		color: #333; /* 更深的字体颜色 */
		z-index: 100;
		cursor: pointer;
		backdrop-filter: blur(20px); /* 更强烈的模糊效果 */
		animation: fadeIn 0.3s ease-in-out;
		border: 1px solid rgba(255, 255, 255, 0.2); /* 添加边框 */
		margin: 0;
	}

	/* 视图切换按钮 */
	.view-switcher {
		display: flex;
		justify-content: center;
		margin-bottom: 20px;
	}

	.view-switcher button {
		padding: 25px;
		margin: 0 5px;
		border: none;
		border-radius: 50%;
		background-color: #f0f0f0;
		cursor: pointer;
		transition: background-color 0.3s ease, transform 0.2s ease;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.view-switcher button:hover {
		background-color: #ddd;
		transform: scale(1.1);
	}

	.view-switcher button.active {
		background-color: #0077b6;
		color: white;
	}

	/* 可视化容器 */
	.visualization-container {
		width: 100%;
		height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	/* 表格样式 */
	.table-container {
		width: 100%;
		overflow: auto;
		font-family: "Arial", sans-serif;
	}

	.text-popup p {
		margin: 0;
		padding: 10px 15px;
		font-size: 1.2rem;
		color: #333;
		text-align: justify;
		line-height: 1.8;
		word-break: break-word;
		white-space: pre-wrap;
		max-width: 90%;
		border-left: 4px solid #3498db;
		background: rgba(255, 255, 255, 0.9);
		box-shadow: inset 2px 2px 8px rgba(0, 0, 0, 0.05);
	}
	/* 使用 ::v-deep 穿透 scoped 样式 */
	::v-deep .custom-table {
		width: 100%;
		border-collapse: collapse;
		margin: 5px auto;
		background-color: #ffffff;
		border: 1px solid #0077b6; /* 外边框颜色 */
		border-radius: 8px;
		overflow: hidden;
		font-family: "Arial", sans-serif;
		font-size: 16px; /* 设置整体字体大小 */
		color: #333333; /* 设置默认文字颜色 */
	}

	/* 表头样式 */
	::v-deep .custom-table th {
		background-color: #0077b6; /* 深蓝色表头 */
		font-weight: bold;
		color: #ffffff; /* 文字白色 */
		text-align: left;
		padding: 12px;
		border: 1px solid #0077b6; /* 表头单元格边框 */
		font-size: 18px; /* 表头字体稍大，增强层次感 */
	}

	/* 单元格样式 */
	::v-deep .custom-table th,
	::v-deep .custom-table td {
		padding: 12px;
		border: 1px solid #0077b6; /* 统一的单元格边框 */
		font-size: 16px; /* 调整字体大小 */
	}

	/* 悬停行高亮 */
	::v-deep .custom-table tr:hover {
		background-color: #cbe8f6; /* 浅蓝色 */
		transition: background-color 0.3s ease-in-out;
	}
</style>
