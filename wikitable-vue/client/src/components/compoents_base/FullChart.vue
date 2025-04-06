<template>
	<div ref="chartContainer" class="full-chart">
		<div v-if="!hasData" class="no-data-message">无数据可显示</div>
	</div>
</template>

<script setup>
	import { ref, computed, onMounted, watch } from "vue";
	import * as d3 from "d3";

	const props = defineProps({
		data: {
			type: Object,
			default: () => ({
				type: "line",
				data: []
			}),
			validator: value => {
				// 确保数据结构正确
				return (
					value &&
					["line", "bar"].includes(value.type) &&
					Array.isArray(value.data)
				);
			}
		},
		compareData: {
			type: Array,
			default: () => [],
			validator: value => Array.isArray(value)
		},
		title: {
			type: String,
			default: ""
		},
		side: {
			type: String,
			default: "left",
			validator: value => ["left", "right"].includes(value)
		}
	});

	const chartContainer = ref(null);
	const color = computed(() => (props.side === "left" ? "#4a90e2" : "#ef4444"));
	const highlightColor = "#FFD700"; // 金色高亮
	const hasData = computed(() => {
		return (
			props.data?.data?.length > 0 &&
			props.data.data.every(
				item => item && !isNaN(item.year) && !isNaN(item.value)
			)
		);
	});

	const drawChart = () => {
		if (!chartContainer.value || !hasData.value) {
			d3.select(chartContainer.value).selectAll("*").remove();
			return;
		}

		try {
			d3.select(chartContainer.value).selectAll("*").remove();

			const margin = { top: 30, right: 30, bottom: 50, left: 50 };
			const width = 800 - margin.left - margin.right;
			const height = 500 - margin.top - margin.bottom;

			const svg = d3
				.select(chartContainer.value)
				.append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", `translate(${margin.left},${margin.top})`);

			// 确保数据有效性
			const validData = props.data.data
				.filter(item => item && !isNaN(item.year) && !isNaN(item.value))
				.sort((a, b) => a.year - b.year);

			if (validData.length === 0) return;

			// 创建比例尺
			const x =
				props.data.type === "bar"
					? d3
							.scaleBand()
							.domain(validData.map(d => d.year.toString()))
							.range([0, width])
							.padding(0.2)
					: d3
							.scaleLinear()
							.domain(d3.extent(validData, d => d.year))
							.range([0, width]);

			const y = d3
				.scaleLinear()
				.domain([0, d3.max(validData, d => d.value) * 1.1])
				.range([height, 0]);

			// 绘制网格线
			svg
				.append("g")
				.attr("class", "grid")
				.call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
				.selectAll("line")
				.attr("stroke", "#e2e8f0")
				.attr("stroke-dasharray", "2,2");

			// 绘制坐标轴
			svg
				.append("g")
				.attr("transform", `translate(0,${height})`)
				.call(
					props.data.type === "bar"
						? d3.axisBottom(x)
						: d3.axisBottom(x).tickFormat(d3.format("d"))
				);
			svg.append("g").call(d3.axisLeft(y));

			// 添加标签
			svg
				.append("text")
				.attr(
					"transform",
					`translate(${width / 2},${height + margin.top + 10})`
				)
				.style("text-anchor", "middle")
				.text("年份");
			svg
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 0 - margin.left)
				.attr("x", 0 - height / 2)
				.attr("dy", "1em")
				.style("text-anchor", "middle")
				.text("数值");
			svg
				.append("text")
				.attr("x", width / 2)
				.attr("y", 0 - margin.top / 2)
				.attr("text-anchor", "middle")
				.style("font-size", "16px")
				.style("font-weight", "bold")
				.text(props.title);

			if (props.data.type === "bar") {
				drawBarChart(svg, validData, x, y, width, height);
			} else {
				drawLineChart(svg, validData, x, y);
			}
		} catch (error) {
			console.error("图表渲染错误:", error);
		}
	};

	const drawBarChart = (svg, data, x, y, width, height) => {
		// 绘制柱子
		svg
			.selectAll(".bar")
			.data(data)
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr("x", d => x(d.year.toString()))
			.attr("width", x.bandwidth())
			.attr("y", d => y(d.value))
			.attr("height", d => height - y(d.value))
			.attr("fill", color.value)
			.attr("rx", 2)
			.attr("ry", 2);

		// 添加数值标签
		svg
			.selectAll(".bar-label")
			.data(data)
			.enter()
			.append("text")
			.attr("class", "bar-label")
			.attr("x", d => x(d.year.toString()) + x.bandwidth() / 2)
			.attr("y", d => y(d.value) - 5)
			.attr("text-anchor", "middle")
			.text(d => formatValue(d.value))
			.attr("font-size", "12px")
			.attr("fill", "#64748b")
			.style("visibility", d =>
				height - y(d.value) > 20 ? "visible" : "hidden"
			);
	};

	const drawLineChart = (svg, data, x, y) => {
		// 创建折线生成器
		const line = d3
			.line()
			.x(d => x(d.year))
			.y(d => y(d.value))
			.curve(d3.curveMonotoneX);

		// 绘制折线
		svg
			.append("path")
			.datum(data)
			.attr("fill", "none")
			.attr("stroke", color.value)
			.attr("stroke-width", 3)
			.attr("d", line);

		// 绘制数据点
		svg
			.selectAll(".dot")
			.data(data)
			.enter()
			.append("circle")
			.attr("class", "dot")
			.attr("cx", d => x(d.year))
			.attr("cy", d => y(d.value))
			.attr("r", 6)
			.attr("fill", color.value)
			.attr("stroke", "white")
			.attr("stroke-width", 2);

		// 高亮相同年份的点
		if (props.compareData && props.compareData.length > 0) {
			const validCompareData = props.compareData.filter(
				item => item && !isNaN(item.year) && !isNaN(item.value)
			);

			if (validCompareData.length > 0) {
				const commonYears = getCommonYears(data, validCompareData);

				commonYears.forEach(year => {
					const points = data.filter(d => d.year === year);
					points.forEach(point => {
						svg
							.append("circle")
							.attr("cx", x(point.year))
							.attr("cy", y(point.value))
							.attr("r", 8)
							.attr("fill", highlightColor)
							.attr("stroke", "#FF8C00")
							.attr("stroke-width", 2)
							.attr("class", "highlight-point");
					});
				});
			}
		}

		// 添加数据标签
		svg
			.selectAll(".text")
			.data(data)
			.enter()
			.append("text")
			.attr("x", d => x(d.year))
			.attr("y", d => y(d.value) - 12)
			.text(d => formatValue(d.value))
			.attr("font-size", "12px")
			.attr("text-anchor", "middle")
			.attr("fill", color.value);
	};

	// 辅助函数：格式化数值显示
	const formatValue = value => {
		if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
		if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
		return value.toLocaleString();
	};

	// 辅助函数：找出共同年份
	const getCommonYears = (data1, data2) => {
		const years1 = new Set(data1.map(d => d.year));
		const years2 = new Set(data2.map(d => d.year));
		return [...years1].filter(year => years2.has(year));
	};

	watch(() => [props.data, props.compareData, props.title], drawChart, {
		deep: true
	});

	onMounted(() => {
		// 添加延迟确保DOM加载完成
		setTimeout(drawChart, 100);
	});
</script>

<style scoped>
	.full-chart {
		width: 100%;
		height: 500px;
		position: relative;
	}

	.no-data-message {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #94a3b8;
		font-size: 14px;
	}

	.full-chart :deep(.highlight-point) {
		animation: pulse 1.5s infinite ease-in-out;
		pointer-events: none;
	}

	@keyframes pulse {
		0% {
			r: 7;
			opacity: 1;
		}
		50% {
			r: 9;
			opacity: 0.8;
		}
		100% {
			r: 7;
			opacity: 1;
		}
	}

	.full-chart :deep(.bar) {
		transition: all 0.3s ease;
	}

	.full-chart :deep(.bar-label) {
		font-family: system-ui, -apple-system, sans-serif;
		pointer-events: none;
	}
</style>
