<template>
	<div class="full-chart">
		<!-- 文本显示 -->
		<template v-if="visualization === 'text-only'">
			<div class="full-text">
				<div
					v-for="(item, index) in formattedData"
					:key="index"
					class="text-item">
					{{ formatDisplayValue(item) }}
				</div>
			</div>
		</template>

		<!-- 完整饼图 -->
		<template v-else-if="visualization === 'pie-chart'">
			<div v-if="hasData" class="chart-container">
				<PieChart :data="pieChartData" />
			</div>
			<div v-else class="no-data">无可用数据</div>
		</template>

		<!-- 完整柱状图 -->
		<template v-else-if="visualization === 'bar-chart'">
			<div v-if="hasData" class="chart-container">
				<BarChart
					:data="barChartData"
					:field-key="fieldKey"
					:show-value="true" />
			</div>
			<div v-else class="no-data">无可用数据</div>
		</template>

		<!-- 完整折线图 -->
		<template v-else-if="visualization === 'line-chart'">
			<div v-if="hasData" class="chart-container">
				<LineChart :data="lineChartData" :show-trend="true" />
			</div>
			<div v-else class="no-data">无可用数据</div>
		</template>

		<!-- 默认显示 -->
		<template v-else>
			<div class="full-text">
				<div
					v-for="(item, index) in formattedData"
					:key="index"
					class="text-item">
					{{ formatDisplayValue(item) }}
				</div>
			</div>
		</template>
	</div>
</template>

<script setup>
	import { computed } from "vue";
	import PieChart from "./charts/PieChart.vue";
	import BarChart from "./charts/BarChart.vue";
	import LineChart from "./charts/LineChart.vue";

	const props = defineProps({
		field: [Object, Array, String, Number],
		type: String,
		visualization: String,
		fieldKey: String
	});

	// 数据预处理（统一数据结构）
	const normalizedData = computed(() => {
		if (!props.field) return [];

		// 处理数组数据
		if (Array.isArray(props.field)) {
			return props.field.map(item => normalizeItem(item));
		}

		// 处理单条数据
		return [normalizeItem(props.field)];
	});

	// 统一数据结构
	const normalizeItem = item => {
		// 已经是标准格式
		if (
			typeof item === "object" &&
			item !== null &&
			("value" in item || "raw" in item)
		) {
			return {
				value: item.value ?? null,
				raw: item.raw ?? String(item.value) ?? "",
				unit: item.unit ?? null,
				year: item.year ?? null,
				currency: item.currency ?? null,
				extracted: item.extracted ?? false
			};
		}

		// 原始值处理
		return {
			value: typeof item === "number" ? item : null,
			raw: String(item),
			unit: null,
			year: null,
			currency: null,
			extracted: false
		};
	};

	// 格式化显示值（带单位）
	const formatDisplayValue = item => {
		if (!item) return "-";

		// 优先使用raw字段
		if (item.raw) {
			let text = item.raw;
			if (item.unit) text += ` ${item.unit}`;
			if (item.year) text += ` (${item.year})`;
			return text;
		}

		// 数值格式化
		if (item.value !== null) {
			let num = item.value;
			let text = "";

			// 百分比处理
			if (props.type === "percentage") {
				return `${num > 0 ? "+" : ""}${num.toFixed(1)}%`;
			}

			// 大数值格式化
			if (Math.abs(num) >= 100000000) {
				text = (num / 100000000).toFixed(2) + "亿";
			} else if (Math.abs(num) >= 10000) {
				text = (num / 10000).toFixed(1) + "万";
			} else {
				text = num.toLocaleString();
			}

			if (item.unit) text += ` ${item.unit}`;
			if (item.year) text += ` (${item.year})`;
			return text;
		}

		return "-";
	};

	// 饼图数据
	const pieChartData = computed(() => {
		return normalizedData.value
			.filter(item => item.value !== null)
			.map((item, index) => ({
				name: item.raw || `项目${index + 1}`,
				value: Math.min(100, Math.max(0, item.value)),
				raw: item.raw,
				unit: item.unit
			}));
	});

	// 柱状图数据
	const barChartData = computed(() => {
		return normalizedData.value.map((item, index) => ({
			name: item.raw || `项目${index + 1}`,
			value: item.value !== null ? item.value : 0,
			raw: item.raw,
			unit: item.unit,
			year: item.year
		}));
	});

	// 折线图数据
	const lineChartData = computed(() => {
		return normalizedData.value
			.filter(item => item.value !== null)
			.map((item, index) => ({
				year: item.year || index + 1,
				value: item.value,
				raw: item.raw,
				unit: item.unit
			}))
			.sort((a, b) => a.year - b.year);
	});

	// 文本显示数据
	const formattedData = computed(() => {
		return normalizedData.value;
	});

	const hasData = computed(() => {
		return (
			normalizedData.value.length > 0 &&
			normalizedData.value.some(
				item => item.value !== null || (item.raw && item.raw.trim() !== "")
			)
		);
	});
</script>

<style scoped>
	.full-chart {
		width: 100%;
		height: 100%;
		padding: 16px;
		box-sizing: border-box;
	}

	.full-text {
		max-height: 400px;
		overflow-y: auto;
	}

	.text-item {
		margin-bottom: 8px;
		padding: 8px;
		background: #f8f9fa;
		border-radius: 4px;
		word-break: break-word;
	}

	.chart-container {
		width: 100%;
		height: 100%;
		min-height: 400px;
	}

	.no-data {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #999;
		font-style: italic;
		font-size: 1.2em;
	}
</style>
