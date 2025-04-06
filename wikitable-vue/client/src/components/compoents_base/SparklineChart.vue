<template>
	<div ref="chartContainer" class="sparkline-container">
		<div v-if="!hasData" class="no-data-message">
			{{ noDataMessage }}
		</div>
	</div>
</template>

<script setup>
	import {
		ref,
		onMounted,
		watch,
		computed,
		nextTick,
		onBeforeUnmount
	} from "vue";
	import * as d3 from "d3";

	const props = defineProps({
		data: {
			type: Array,
			default: () => [],
			validator: value => Array.isArray(value)
		},
		compareData: {
			type: Array,
			default: null
		},
		maxWidth: {
			type: Number,
			default: 250
		},
		maxHeight: {
			type: Number,
			default: 80
		},
		margin: {
			type: Object,
			default: () => ({ top: 5, right: 5, bottom: 5, left: 5 })
		},
		lineColor: {
			type: String,
			default: "#4a90e2"
		},
		areaColor: {
			type: String,
			default: "#4a90e2"
		},
		dotColor: {
			type: String,
			default: "#4a90e2"
		},
		highlightColor: {
			type: String,
			default: "#FFD700"
		},
		showTooltip: {
			type: Boolean,
			default: true
		},
		showDots: {
			type: Boolean,
			default: true
		},
		showArea: {
			type: Boolean,
			default: true
		},
		showYearMarkers: {
			type: Boolean,
			default: true
		},
		curveType: {
			type: String,
			default: "curveMonotoneX"
		},
		maxBarWidth: {
			type: Number,
			default: 60
		}
	});

	const emit = defineEmits(["chart-mounted"]);

	const chartContainer = ref(null);
	const svg = ref(null);
	const tooltip = ref(null);
	const resizeObserver = ref(null);
	const containerSize = ref({
		width: props.maxWidth,
		height: props.maxHeight
	});

	const updateContainerSize = () => {
		if (chartContainer.value) {
			containerSize.value = {
				width: Math.min(chartContainer.value.clientWidth, props.maxWidth),
				height: Math.min(
					chartContainer.value.clientHeight || props.maxHeight,
					props.maxHeight
				)
			};
		}
	};

	const innerWidth = computed(() => {
		return Math.max(
			10,
			containerSize.value.width - props.margin.left - props.margin.right
		);
	});

	const innerHeight = computed(() => {
		return Math.max(
			10,
			containerSize.value.height - props.margin.top - props.margin.bottom
		);
	});

	const sortedData = computed(() => {
		if (!Array.isArray(props.data)) return [];
		return [...props.data]
			.filter(item => item && !isNaN(item.year) && !isNaN(item.value))
			.sort((a, b) => a.year - b.year);
	});

	const hasData = computed(() => sortedData.value.length > 0);
	const showBarChart = computed(() => sortedData.value.length <= 3);
	const showLineChart = computed(() => sortedData.value.length > 3);
	const noDataMessage = computed(() => "无数据");
	const chartType = computed(() => (showBarChart.value ? "bar" : "line"));

	const initChart = () => {
		if (!chartContainer.value) return;

		updateContainerSize();

		d3.select(chartContainer.value).selectAll("*").remove();
		if (!hasData.value) return;

		svg.value = d3
			.select(chartContainer.value)
			.append("svg")
			.attr("width", containerSize.value.width)
			.attr("height", containerSize.value.height)
			.attr(
				"viewBox",
				`0 0 ${containerSize.value.width} ${containerSize.value.height}`
			)
			.attr("preserveAspectRatio", "xMidYMid meet");

		const chart = svg.value
			.append("g")
			.attr("transform", `translate(${props.margin.left},${props.margin.top})`);

		if (showBarChart.value) {
			drawBarChart(chart);
		} else if (showLineChart.value) {
			drawLineChart(chart);
		}

		emit("chart-mounted", {
			chartType: chartType.value
		});
	};

	const drawBarChart = chart => {
		const xScale = d3
			.scaleBand()
			.domain(sortedData.value.map(d => d.year.toString()))
			.range([0, innerWidth.value])
			.paddingInner(0.4)
			.paddingOuter(0.2);

		const calculatedWidth = xScale.bandwidth();
		const barWidth = Math.min(calculatedWidth, props.maxBarWidth);
		const adjustedPadding =
			(innerWidth.value - barWidth * sortedData.value.length) /
			(sortedData.value.length + 1);

		const adjustedXScale = d3
			.scaleBand()
			.domain(sortedData.value.map(d => d.year.toString()))
			.range([0, innerWidth.value])
			.paddingInner(adjustedPadding / barWidth)
			.paddingOuter(adjustedPadding / barWidth);

		const maxValue = d3.max(sortedData.value, d => d.value);
		const yScale = d3
			.scaleLinear()
			.domain([0, maxValue * 1.1])
			.range([innerHeight.value, 0]);

		chart
			.selectAll(".bar")
			.data(sortedData.value)
			.enter()
			.append("rect")
			.attr("class", "bar")
			.attr(
				"x",
				d =>
					adjustedXScale(d.year.toString()) +
					(adjustedXScale.bandwidth() - barWidth) / 2
			)
			.attr("width", barWidth)
			.attr("y", d => yScale(d.value))
			.attr("height", d => innerHeight.value - yScale(d.value))
			.attr("fill", props.lineColor)
			.attr("rx", 2)
			.attr("ry", 2);

		chart
			.selectAll(".bar-label")
			.data(sortedData.value)
			.enter()
			.append("text")
			.attr("class", "bar-label")
			.attr(
				"x",
				d => adjustedXScale(d.year.toString()) + adjustedXScale.bandwidth() / 2
			)
			.attr("y", d => yScale(d.value) - 5)
			.attr("text-anchor", "middle")
			.text(d => formatValue(d.value))
			.attr("font-size", "10px")
			.attr("fill", "#64748b")
			.style("visibility", d =>
				innerHeight.value - yScale(d.value) > 20 ? "visible" : "hidden"
			);
	};

	const drawLineChart = chart => {
		const years = sortedData.value.map(d => d.year);
		const xScale = d3
			.scaleLinear()
			.domain(d3.extent(years))
			.range([0, innerWidth.value]);

		const values = sortedData.value.map(d => d.value);
		const minValue = d3.min(values);
		const maxValue = d3.max(values);
		const padding = (maxValue - minValue) * 0.1;

		const yScale = d3
			.scaleLinear()
			.domain([minValue - padding, maxValue + padding])
			.range([innerHeight.value, 0]);

		const lineGenerator = d3
			.line()
			.x(d => xScale(d.year))
			.y(d => yScale(d.value))
			.curve(d3[props.curveType]);

		chart
			.append("path")
			.attr("class", "sparkline-line")
			.attr("d", lineGenerator(sortedData.value))
			.attr("stroke", props.lineColor)
			.attr("stroke-width", 2)
			.attr("fill", "none");

		if (props.showDots) {
			chart
				.selectAll(".sparkline-dot")
				.data(sortedData.value)
				.enter()
				.append("circle")
				.attr("class", "sparkline-dot")
				.attr("cx", d => xScale(d.year))
				.attr("cy", d => yScale(d.value))
				.attr("r", 3)
				.attr("fill", props.dotColor);
		}

		if (props.compareData && props.showYearMarkers) {
			const commonYears = getCommonYears(sortedData.value, props.compareData);
			commonYears.forEach(year => {
				const points = sortedData.value.filter(d => d.year === year);
				points.forEach(point => {
					chart
						.append("circle")
						.attr("cx", xScale(point.year))
						.attr("cy", yScale(point.value))
						.attr("r", 5)
						.attr("fill", props.highlightColor)
						.attr("stroke", "#FF8C00")
						.attr("stroke-width", 1.5)
						.attr("class", "highlight-point");
				});
			});
		}

		if (props.showTooltip) {
			addTooltip(chart, xScale, yScale);
		}
	};

	const getCommonYears = (data1, data2) => {
		const years1 = new Set(data1.map(d => d.year));
		const years2 = new Set(data2.filter(d => d).map(d => d.year));
		return [...years1].filter(year => years2.has(year));
	};

	const formatValue = value => {
		if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
		if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
		return value.toLocaleString();
	};

	const addTooltip = (chart, xScale, yScale) => {
		tooltip.value = chart
			.append("g")
			.attr("class", "tooltip")
			.style("opacity", 0)
			.attr("pointer-events", "none");

		tooltip.value
			.append("rect")
			.attr("class", "tooltip-box")
			.attr("rx", 4)
			.attr("ry", 4);

		tooltip.value
			.append("text")
			.attr("class", "tooltip-year")
			.attr("x", 6)
			.attr("y", 18);

		tooltip.value
			.append("text")
			.attr("class", "tooltip-value")
			.attr("x", 6)
			.attr("y", 36);

		const referenceLine = chart
			.append("line")
			.attr("class", "reference-line")
			.attr("stroke", "#64748b")
			.attr("stroke-width", 1)
			.attr("stroke-dasharray", "2,2")
			.attr("y1", 0)
			.attr("y2", innerHeight.value)
			.style("opacity", 0);

		chart
			.append("rect")
			.attr("class", "overlay")
			.attr("width", innerWidth.value)
			.attr("height", innerHeight.value)
			.attr("fill", "none")
			.attr("pointer-events", "all")
			.on("mouseover", () => tooltip.value.style("opacity", 1))
			.on("mouseout", () => {
				tooltip.value.style("opacity", 0);
				referenceLine.style("opacity", 0);
			})
			.on("mousemove", event => {
				const [mouseX] = d3.pointer(event);
				const year = xScale.invert(mouseX);
				const closest = d3.least(sortedData.value, d =>
					Math.abs(xScale(d.year) - mouseX)
				);

				if (!closest) return;

				referenceLine
					.attr("x1", xScale(closest.year))
					.attr("x2", xScale(closest.year))
					.style("opacity", 1);

				tooltip.value.select(".tooltip-year").text(`Year: ${closest.year}`);
				tooltip.value
					.select(".tooltip-value")
					.text(`Value: ${formatValue(closest.value)}`);

				const tooltipText = tooltip.value.node().querySelectorAll("text");
				const bbox = tooltipText[0].getBBox();
				const bbox2 = tooltipText[1].getBBox();
				const tooltipWidth = Math.max(bbox.width, bbox2.width) + 12;
				const tooltipHeight = bbox.height + bbox2.height + 16;

				let x = xScale(closest.year) + 10;
				let y = yScale(closest.value) - tooltipHeight / 2;

				if (x + tooltipWidth > innerWidth.value) {
					x = xScale(closest.year) - tooltipWidth - 10;
				}
				y = Math.max(0, Math.min(y, innerHeight.value - tooltipHeight));

				tooltip.value
					.select(".tooltip-box")
					.attr("x", x)
					.attr("y", y)
					.attr("width", tooltipWidth)
					.attr("height", tooltipHeight);

				tooltip.value
					.select(".tooltip-year")
					.attr("x", x + 6)
					.attr("y", y + 18);

				tooltip.value
					.select(".tooltip-value")
					.attr("x", x + 6)
					.attr("y", y + 36);
			});
	};

	const setupResizeObserver = () => {
		if (resizeObserver.value) {
			resizeObserver.value.disconnect();
		}

		if (chartContainer.value) {
			resizeObserver.value = new ResizeObserver(() => {
				nextTick(() => {
					updateContainerSize();
					initChart();
				});
			});
			resizeObserver.value.observe(chartContainer.value);
		}
	};

	onMounted(() => {
		setupResizeObserver();
		initChart();
	});

	onBeforeUnmount(() => {
		if (resizeObserver.value) {
			resizeObserver.value.disconnect();
		}
	});

	watch(
		() => [
			props.data,
			props.compareData,
			props.maxWidth,
			props.maxHeight,
			props.margin,
			props.lineColor,
			props.highlightColor,
			props.showTooltip,
			props.showDots,
			props.showYearMarkers,
			props.curveType,
			props.maxBarWidth
		],
		initChart,
		{ deep: true }
	);

	defineExpose({
		chartType
	});
</script>

<style scoped>
	.sparkline-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-width: 100px;
		min-height: 60px;
		overflow: hidden;
	}

	.no-data-message {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #94a3b8;
		font-size: 12px;
		text-align: center;
		width: 100%;
		pointer-events: none;
	}

	.sparkline-container :deep(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}

	.sparkline-container :deep(.tooltip-box) {
		fill: white;
		stroke: #e2e8f0;
		stroke-width: 1;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
	}

	.sparkline-container :deep(.tooltip-year) {
		font-size: 12px;
		font-weight: bold;
		fill: #334155;
	}

	.sparkline-container :deep(.tooltip-value) {
		font-size: 12px;
		fill: #1e40af;
		font-weight: 600;
	}

	.sparkline-container :deep(.reference-line) {
		pointer-events: none;
	}

	.sparkline-container :deep(.bar) {
		transition: height 0.3s ease, y 0.3s ease;
	}

	.sparkline-container :deep(.bar-label) {
		pointer-events: none;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.sparkline-container :deep(.highlight-point) {
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0% {
			r: 4;
			opacity: 1;
		}
		50% {
			r: 6;
			opacity: 0.8;
		}
		100% {
			r: 4;
			opacity: 1;
		}
	}
</style>
