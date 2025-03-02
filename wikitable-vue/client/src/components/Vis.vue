<template>
	<div>
		<!-- <h1>Data Visualization with D3.js</h1> -->
		<div>
			<label for="jsonData">输入 JSON 数据：</label>
			<textarea id="jsonData" v-model="jsonData" rows="5" cols="50"></textarea>
		</div>
		<div>
			<label for="visualizationType">选择可视化类型：</label>
			<select id="visualizationType" v-model="selectedVisualizationType">
				<option value="bar">柱状图 (Bar Chart)</option>
				<option value="line">折线图 (Line Chart)</option>
				<option value="pie">饼图 (Pie Chart)</option>
				<option value="scatter">散点图 (Scatter Plot)</option>
				<option value="treemap">树状图 (Treemap)</option>
				<option value="AUTO">论证单元树 (AUTO)</option>
			</select>
		</div>
		<button @click="fetchRecommendation">获取可视化推荐</button>
		<button @click="renderChart">手动渲染图表</button>
		<div v-if="visualizationType">
			<h2>推荐的可视化类型：{{ visualizationType }}</h2>
			<div ref="chart"></div>
		</div>
	</div>
</template>

<script>
	import * as d3 from "d3";

	export default {
		data() {
			return {
				jsonData: '{"A": 10, "B": 20, "C": 30, "D": 40}', // 默认 JSON 数据
				visualizationType: "", // 推荐的可视化类型
				selectedVisualizationType: "bar", // 用户选择的可视化类型
				chartData: {} // 用于存储图表数据
			};
		},
		methods: {
			// 获取后端推荐的可视化类型
			async fetchRecommendation() {
				try {
					const response = await fetch(
						"http://localhost:8888/recommend_visualization",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json"
							},
							body: JSON.stringify({
								data: JSON.parse(this.jsonData)
							})
						}
					);
					const result = await response.json();
					this.visualizationType = result.visualization_type;
					this.chartData = result.data;
					this.$nextTick(() => {
						this.renderChart(); // 确保 DOM 更新后渲染图表
					});
				} catch (error) {
					console.error("获取推荐失败：", error);
				}
			},
			// 手动渲染图表
			renderChart() {
				const chartElement = this.$refs.chart;
				if (!chartElement) {
					console.error("图表容器未找到");
					return;
				}

				// 清空之前的图表
				chartElement.innerHTML = "";

				const svg = d3
					.select(chartElement)
					.append("svg")
					.attr("width", 500)
					.attr("height", 500);

				const data = Object.entries(this.chartData);

				// 根据用户选择的可视化类型渲染图表
				switch (this.selectedVisualizationType) {
					case "bar":
						this.renderBarChart(svg, data);
						break;
					case "line":
						this.renderLineChart(svg, data);
						break;
					case "pie":
						this.renderPieChart(svg, data);
						break;
					case "scatter":
						this.renderScatterChart(svg, data);
						break;
					case "treemap":
						this.renderTreemap(svg, data);
						break;
					case "AUTO":
						this.renderAuto(svg, data);
					default:
						console.error("未知的可视化类型：", this.selectedVisualizationType);
				}
			},
			// 渲染柱状图
			renderBarChart(svg, data) {
				svg
					.selectAll("rect")
					.data(data)
					.enter()
					.append("rect")
					.attr("x", (d, i) => i * 100)
					.attr("y", d => 500 - d[1] * 10)
					.attr("width", 50)
					.attr("height", d => d[1] * 10)
					.attr("fill", "blue");
			},
			// 渲染折线图
			renderLineChart(svg, data) {
				const line = d3
					.line()
					.x((d, i) => i * 50)
					.y(d => 500 - d[1] * 10);

				svg
					.append("path")
					.datum(data)
					.attr("d", line)
					.attr("fill", "none")
					.attr("stroke", "green")
					.attr("stroke-width", 2);
			},
			// 渲染饼图
			renderPieChart(svg, data) {
				const pie = d3.pie().value(d => d[1]);

				const arcs = pie(data);

				const arc = d3.arc().innerRadius(0).outerRadius(200);

				const g = svg.append("g").attr("transform", "translate(250, 250)");

				g.selectAll("path")
					.data(arcs)
					.enter()
					.append("path")
					.attr("d", arc)
					.attr("fill", (d, i) => d3.schemeCategory10[i]);
			},
			// 渲染散点图
			renderScatterChart(svg, data) {
				svg
					.selectAll("circle")
					.data(data)
					.enter()
					.append("circle")
					.attr("cx", (d, i) => i * 100)
					.attr("cy", d => 500 - d[1] * 10)
					.attr("r", 5)
					.attr("fill", "red");
			},
			// 渲染树状图
			renderTreemap(svg, data) {
				const root = d3.hierarchy({ children: data }).sum(d => d[1]); // 使用数据的值作为权重

				const treemap = d3
					.treemap()
					.size([500, 500]) // 设置树状图的大小
					.padding(1);

				treemap(root);

				const cells = svg
					.selectAll("g")
					.data(root.leaves())
					.enter()
					.append("g")
					.attr("transform", d => `translate(${d.x0},${d.y0})`);

				cells
					.append("rect")
					.attr("width", d => d.x1 - d.x0)
					.attr("height", d => d.y1 - d.y0)
					.attr("fill", (d, i) => d3.schemeCategory10[i % 10]);

				cells
					.append("text")
					.attr("x", 5)
					.attr("y", 20)
					.text(d => d.data[0]); // 显示标签
			},
			// 渲染AUTO
			renderAuto(svg, data) {
				//维度
				const dms = {
					width: 100,
					height: 500,
					margin: {
						top: 50,
						bottom: 50,
						right: 100,
						left: 100
					}
				};
				dms.contentWidth = dms.width - dms.margin.left - dms.margin.right;
				dms.contentHeight = dms.height - dms.margin.top - dms.margin.bottom;
				//整个盒子
				const box = svg
					.attr("id", "box")
					.attr("width", dms.width)
					.attr("height", dms.height);
				//内容区
				const content = box
					.append("g")
					.attr("id", "content")
					.style(
						"transform",
						`translate(${dms.margin.left}px,${dms.margin.top}px)`
					);
				const circles = content.append("g").attr("class", "circles");
				const paths = content.append("g").attr("class", "paths");
				const up_lines = content.append("g");
				const down_lines = content.append("g");
				const transverse_lines = paths
					.append("g")
					.attr("class", "transverse_lines");
				const rects = content.append("g").attr("class", "circles");
				let root;

				root = d3.hierarchy(data);
				root = d3.tree().size([dms.contentWidth, dms.contentHeight])(root);
				console.log("root:", root);
				render(root);

				function render(data) {
					let levelObj = {};
					let level = [];
					let kData = data.descendants();
					for (let i = 0; i < kData.length; i++) {
						kData[i].key = i;
					}
					kData.forEach(d => {
						if (d.parent) {
							// 检查 levelObj 对象中是否已经存在以 d.parent.key 为键的数组
							if (!levelObj[d.parent.key]) {
								// 如果不存在，创建一个空数组
								levelObj[d.parent.key] = [];
							}
						}
					});
					kData.forEach(d => {
						if (d.parent) {
							// 直接使用 d.parent.key 作为键，向 levelObj 对象中的数组添加元素
							levelObj[d.parent.key].push([d.x, d.y]);
						}
					});
					//把对象转成数组
					level = Object.values(levelObj);
					//画线
					down_lines
						.selectAll("path")
						//.links 生成一个包含源节点和目标节点信息的数组
						.data(data.links())
						.join("path")
						.attr("fill", "none")
						.attr("stroke", "black")
						.attr("stroke-width", 1.5)
						//画下竖线
						.attr("d", d => {
							// console.log('root:',d.source.x);
							return `M${d.source.x},${d.source.y + 50},${d.source.x},${
								d.target.y - 20
							}`;
						});

					//画上竖线
					up_lines
						.selectAll("path")
						//.links 生成一个包含源节点和目标节点信息的数组
						.data(data.links())
						.join("path")
						.attr("fill", "none")
						.attr("stroke", "black")
						.attr("stroke-width", 1.5)
						.attr("d", d => {
							return `M${d.target.x},${d.target.y},${d.target.x},${
								d.target.y - 20
							}`;
						});
					//画每一层的大横线
					transverse_lines
						.selectAll("path")
						.data(level)
						.join("path")
						.attr("fill", "none")
						.attr("stroke", "black")
						.attr("stroke-width", 1.5)
						.attr("d", d => {
							const startX = d[0][0];
							const y = d[0][1] - 20;
							const endX = d[d.length - 1][0];
							return `M${startX},${y} L${endX},${y}`;
						});

					//画矩形
					circles
						.selectAll()
						.data(root.descendants())
						.join("rect")
						.attr("x", d => d.x - 5)
						.attr("y", d => d.y)
						.attr("width", 10)
						.attr("height", 50)
						.attr("stroke-width", 3)
						.attr("fill", d => {
							if (d.depth === 0) {
								return "blue";
							} else {
								if (d.data.attitude == "y") {
									return "green";
								} else {
									return "red";
								}
							}
						});
				}
			}
		}
	};
</script>

<style scoped>
	textarea {
		margin-bottom: 20px;
	}
	button {
		margin-bottom: 20px;
	}
	.chart {
		margin: 20px;
	}
</style>
