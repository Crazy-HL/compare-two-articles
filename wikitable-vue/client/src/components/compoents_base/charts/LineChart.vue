<template>
	<div ref="chartEl" class="line-chart"></div>
</template>

<script setup>
	import { ref, onMounted, watch } from "vue";
	import * as echarts from "echarts";

	const props = defineProps({
		data: {
			type: Array,
			default: () => []
		}
	});

	const chartEl = ref(null);
	let chartInstance = null;

	// 格式化数值显示
	const formatNumber = value => {
		const num = Number(value);
		return isNaN(num) ? "0" : num.toFixed(2) + "%";
	};

	const initChart = () => {
		if (!chartEl.value) return;

		chartInstance = echarts.init(chartEl.value);

		const option = {
			tooltip: {
				trigger: "axis",
				formatter: params => {
					return params
						.map(param => {
							let tip = `${param.seriesName}<br/>${
								param.axisValueLabel
							}: ${formatNumber(param.value)}`;
							if (param.data.unit) tip += ` ${param.data.unit}`;
							return tip;
						})
						.join("<br/>");
				}
			},
			xAxis: {
				type: "category",
				data: props.data.map(item => item.year),
				axisLabel: {
					interval: 0,
					rotate: props.data.length > 5 ? 30 : 0
				}
			},
			yAxis: {
				type: "value",
				axisLabel: {
					formatter: "{value}%"
				}
			},
			series: [
				{
					data: props.data.map(item => ({
						value: Number(item.value) || 0,
						unit: item.unit
					})),
					type: "line",
					smooth: true,
					symbol: "circle",
					symbolSize: 8,
					itemStyle: {
						color: "#3498db"
					},
					lineStyle: {
						width: 3
					},
					label: {
						show: true,
						formatter: params => {
							return formatNumber(params.value);
						}
					}
				}
			]
		};

		chartInstance.setOption(option);
	};

	onMounted(() => {
		initChart();
		window.addEventListener("resize", () => chartInstance?.resize());
	});

	watch(
		() => props.data,
		() => {
			if (chartInstance) {
				initChart();
			}
		},
		{ deep: true }
	);
</script>

<style scoped>
	.line-chart {
		width: 100%;
		height: 100%;
		min-height: 300px;
	}
</style>
