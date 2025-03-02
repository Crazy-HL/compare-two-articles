<template>
	<div id="app">
		<h1>文章内容可视化工具</h1>
		<div class="upload-section">
			<textarea v-model="text" placeholder="请输入文章内容"></textarea>
			<button @click="processText">提交并可视化</button>
		</div>

		<div class="visualization-section">
			<h2>可视化结果</h2>
			<div ref="chart" class="chart-container"></div>
		</div>
	</div>
</template>

<script>
	import * as d3 from "d3";
	import { toRaw } from "vue";
	import {
		renderLineChart,
		renderBarChart,
		renderPieChart
	} from "@/js/chartUtils";

	export default {
		data() {
			return {
				text: "", // 用户输入的文章内容
				jsonData: null // 后端返回的 JSON 数据
			};
		},
		methods: {
			// 提交文章内容并获取处理结果
			async processText() {
				try {
					const response = await fetch("http://localhost:8888/process_text", {
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({ text: this.text })
					});
					const result = await response.json();

					// 检查是否有错误信息
					if (result.error) {
						console.error("后端返回的错误:", result.error);
						alert(`处理文章内容时出错: ${result.message}`);
						return;
					}

					// 赋值时确保 jsonData 是对象
					this.jsonData = result.json_data;
					console.log("后端返回的数据:", result.json_data);
					console.log("赋值后的 jsonData:", this.jsonData);
					this.renderChart();
				} catch (error) {
					console.error("处理文章内容时出错:", error);
					alert("处理文章内容时出错，请稍后重试");
				}
			},

			// 渲染图表
			renderChart() {
				// 将响应式对象转换为普通对象
				const rawJsonData = toRaw(this.jsonData);

				if (
					!rawJsonData ||
					typeof rawJsonData !== "object" ||
					!rawJsonData.data
				) {
					console.error("JSON 数据无效:", rawJsonData);
					return;
				}

				// 清空之前的图表
				d3.select(this.$refs.chart).html("");

				const chartType = rawJsonData.type;
				const data = rawJsonData.data;
				const options = rawJsonData.options || {};

				if (chartType === "line") {
					renderLineChart(this.$refs.chart, data, options);
				} else if (chartType === "bar") {
					renderBarChart(this.$refs.chart, data, options);
				} else if (chartType === "pie") {
					renderPieChart(this.$refs.chart, data, options);
				} else {
					console.error("未知的图表类型:", chartType);
				}
			}
		}
	};
</script>

<style>
	#app {
		font-family: Avenir, Helvetica, Arial, sans-serif;
		text-align: center;
		margin-top: 60px;
	}

	.upload-section {
		margin-bottom: 20px;
	}

	textarea {
		width: 80%;
		height: 150px;
		margin-bottom: 20px;
		padding: 10px;
		font-size: 16px;
	}

	button {
		padding: 10px 20px;
		font-size: 16px;
		cursor: pointer;
	}

	.chart-container {
		width: 800px;
		height: 400px;
		margin-top: 20px;
		border: 1px solid #ccc; /* 添加边框以便查看容器 */
	}
</style>
