<template>
	<div class="compare-container" ref="containerRef">
		<div class="table-grid">
			<!-- 表头 -->
			<div class="header left-column">
				{{ processedTable1.title || "表格1" }}
			</div>
			<div class="header middle-column">对比属性</div>
			<div class="header right-column">
				{{ processedTable2.title || "表格2" }}
			</div>

			<!-- 数据行 -->
			<template v-if="hasData">
				<template v-for="attr in commonAttributes" :key="attr">
					<div class="cell left-column" @click="showFullChart(attr, 'left')">
						<template v-if="hasDataForAttribute(processedTable1, attr)">
							<div class="chart-wrapper">
								<SparklineChart
									ref="leftCharts"
									:data="processedTable1.timeSeriesData[attr]"
									:compare-data="processedTable2.timeSeriesData[attr]"
									:max-width="chartMaxWidth"
									:max-height="chartMaxHeight"
									:show-year-markers="true"
									:line-color="leftChartColor"
									@chart-mounted="chart => (chartRefs1[attr] = chart)" />
							</div>
							<!-- <div class="stats-summary">
								平均: {{ getAverage(processedTable1, attr) }} | 最大:
								{{ getMax(processedTable1, attr) }}
							</div> -->
						</template>
						<div v-else class="no-data">无数据</div>
					</div>

					<div class="cell middle-column">
						<div class="attribute-name">{{ attr }}</div>
					</div>

					<div class="cell right-column" @click="showFullChart(attr, 'right')">
						<template v-if="hasDataForAttribute(processedTable2, attr)">
							<div class="chart-wrapper">
								<SparklineChart
									ref="rightCharts"
									:data="processedTable2.timeSeriesData[attr]"
									:compare-data="processedTable1.timeSeriesData[attr]"
									:max-width="chartMaxWidth"
									:max-height="chartMaxHeight"
									:show-year-markers="true"
									:line-color="rightChartColor"
									@chart-mounted="chart => (chartRefs2[attr] = chart)" />
							</div>
							<!-- <div class="stats-summary">
								平均: {{ getAverage(processedTable2, attr) }} | 最大:
								{{ getMax(processedTable2, attr) }}
							</div> -->
						</template>
						<div v-else class="no-data">无数据</div>
					</div>
				</template>
			</template>
			<template v-else>
				<!-- 空状态下的行 -->
				<div class="cell left-column empty-cell"></div>
				<div class="cell middle-column empty-cell"></div>
				<div class="cell right-column empty-cell"></div>
				<div class="cell left-column empty-cell"></div>
				<div class="cell middle-column empty-cell"></div>
				<div class="cell right-column empty-cell"></div>
				<div class="cell left-column empty-cell"></div>
				<div class="cell middle-column empty-cell"></div>
				<div class="cell right-column empty-cell"></div>
			</template>
		</div>

		<!-- 完整图表弹窗 -->
		<div
			v-if="showFullChartModal"
			class="full-chart-modal"
			@click.self="hideFullChart">
			<div class="modal-content">
				<div class="modal-header">
					<h3>{{ currentAttribute }}</h3>
					<button @click="hideFullChart" class="close-button">×</button>
				</div>
				<FullChart
					:data="currentChartData"
					:title="currentAttribute"
					:side="currentSide" />
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
	import SparklineChart from "./SparklineChart.vue";
	import FullChart from "./FullChart.vue";
	import { debounce } from "lodash-es";

	const props = defineProps({
		div1RawData: String,
		div3RawData: String
	});

	// 容器引用
	const containerRef = ref(null);

	// 图表尺寸控制
	const chartMaxWidth = ref(250);
	const chartMaxHeight = ref(80);
	const leftChartColor = ref("#4a90e2");
	const rightChartColor = ref("#ef4444");

	// 表格数据处理
	const processedTable1 = ref({
		title: "表格1",
		rows: [],
		columns: [],
		timeSeriesData: {}
	});
	const processedTable2 = ref({
		title: "表格2",
		rows: [],
		columns: [],
		timeSeriesData: {}
	});

	// 图表引用
	const chartRefs1 = ref({});
	const chartRefs2 = ref({});

	// 完整图表弹窗相关状态
	const showFullChartModal = ref(false);
	const currentAttribute = ref("");
	const currentChartData = ref({ type: "line", data: [] });
	const currentSide = ref("left");

	// 更新图表尺寸
	const updateChartSize = debounce(() => {
		if (containerRef.value) {
			const containerWidth = containerRef.value.clientWidth;
			chartMaxWidth.value = Math.min(250, containerWidth * 0.3);
			// 可以根据需要动态计算高度
			chartMaxHeight.value = 80;
		}
	}, 100);

	// 初始化尺寸和监听
	onMounted(() => {
		updateChartSize();
		window.addEventListener("resize", updateChartSize);
	});

	onBeforeUnmount(() => {
		window.removeEventListener("resize", updateChartSize);
	});

	const showFullChart = (attr, side) => {
		currentAttribute.value = attr;
		currentSide.value = side;

		const chartRef =
			side === "left" ? chartRefs1.value[attr] : chartRefs2.value[attr];
		const chartType = chartRef?.chartType || "line";

		if (side === "left") {
			currentChartData.value = {
				type: chartType,
				data: processedTable1.value.timeSeriesData[attr] || []
			};
		} else {
			currentChartData.value = {
				type: chartType,
				data: processedTable2.value.timeSeriesData[attr] || []
			};
		}

		showFullChartModal.value = true;
	};

	const hideFullChart = () => {
		showFullChartModal.value = false;
	};

	const hasData = computed(() => {
		return (
			props.div1RawData &&
			props.div3RawData &&
			processedTable1.value.columns.length > 0 &&
			processedTable2.value.columns.length > 0
		);
	});

	const commonAttributes = computed(() => {
		const attrs1 = processedTable1.value.rows || [];
		const attrs2 = processedTable2.value.rows || [];
		return attrs1.filter(
			attr =>
				attrs2.includes(attr) &&
				(hasDataForAttribute(processedTable1.value, attr) ||
					hasDataForAttribute(processedTable2.value, attr))
		);
	});

	function parseTableToStandardJSON(html, defaultTitle = "未命名表格") {
		const result = {
			title: extractTitleFromHTML(html) || defaultTitle,
			rows: [],
			columns: [],
			timeSeriesData: {}
		};

		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");
			const table = doc.querySelector("table");
			if (!table) return result;

			// 提取表头
			const headerCells = table.querySelector("tr")?.children || [];
			result.rows = Array.from(headerCells).map(cell => {
				return cell.textContent
					.replace(/[\n†*]/g, "")
					.trim()
					.replace(/\s+/g, " ");
			});

			// 检查是否有Year列
			const yearColumnIndex = result.rows.findIndex(header =>
				header.toLowerCase().includes("year")
			);
			const hasYearColumn = yearColumnIndex !== -1;

			// 辅助函数：清理年份格式
			const cleanYear = yearStr => {
				if (!yearStr) return null;
				let cleaned = yearStr.toString().replace(/[†*]/g, "").trim();
				if (/^\d{4}[\u2013\u2014-]\d{2}$/.test(cleaned)) {
					const startYear = cleaned.substring(0, 4);
					return parseInt(startYear);
				}
				const yearMatch = cleaned.match(/\d{4}/);
				return yearMatch ? parseInt(yearMatch[0]) : null;
			};

			// 提取数据行
			const dataRows = Array.from(
				table.querySelectorAll("tr:not(:first-child)")
			);

			dataRows.forEach(row => {
				const cells = Array.from(row.children);
				if (cells.length === 0) return;

				const recordName = cells[0].textContent.trim();
				const recordData = {};

				result.rows.forEach((header, index) => {
					if (index < cells.length) {
						let value = cells[index].textContent.trim();
						if (index === yearColumnIndex) {
							value = cleanYear(value);
						} else {
							value = smartValueConversion(value);
						}
						recordData[header] = value;
					}
				});

				if (!hasYearColumn || (hasYearColumn && recordData.Year)) {
					result.columns.push({
						name: recordName,
						data: recordData
					});

					if (hasYearColumn && recordData.Year) {
						const year = recordData.Year;
						result.rows.forEach(header => {
							if (header === "Year" || typeof recordData[header] !== "number")
								return;
							if (!result.timeSeriesData[header]) {
								result.timeSeriesData[header] = [];
							}
							result.timeSeriesData[header].push({
								year: year,
								value: recordData[header],
								recordName: recordName
							});
						});
					}
				}
			});

			// 对每个属性的时间序列数据按年份排序
			if (hasYearColumn) {
				Object.keys(result.timeSeriesData).forEach(attr => {
					result.timeSeriesData[attr].sort((a, b) => a.year - b.year);
				});
			}

			console.log("解析后的表格数据:", result);
			return result;
		} catch (error) {
			console.error("表格解析错误:", error);
			return result;
		}
	}

	function smartValueConversion(rawValue) {
		if (!rawValue || ["-", "—", "N/A"].includes(rawValue)) return null;
		if (/^\.\d+$/.test(rawValue)) return parseFloat(rawValue);
		const numericValue = parseFloat(rawValue.replace(/[^\d.-]/g, ""));
		if (!isNaN(numericValue)) return numericValue;
		if (/(\d{4}-\d{2}-\d{2})|(\d{2}\/\d{2}\/\d{4})/.test(rawValue))
			return rawValue;
		if (["true", "false"].includes(rawValue.toLowerCase())) {
			return rawValue.toLowerCase() === "true";
		}
		return rawValue;
	}

	function extractTitleFromHTML(html) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		return (
			doc.querySelector("h1, h2, h3, h4, caption")?.textContent.trim() || null
		);
	}

	function hasDataForAttribute(table, attr) {
		return table.timeSeriesData[attr]?.length > 0;
	}

	function getAverage(table, attr) {
		const values = table.timeSeriesData[attr]?.map(item => item.value) || [];
		return values.length
			? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
			: "N/A";
	}

	function getMax(table, attr) {
		const values = table.timeSeriesData[attr]?.map(item => item.value) || [];
		return values.length ? Math.max(...values).toFixed(2) : "N/A";
	}

	// async function sendToBackend() {
	// 	try {
	// 		const response = await api.post("table_compare", {
	// 			table1: processedTable1.value,
	// 			table2: processedTable2.value
	// 		});
	// 		console.log("分析结果:", response);
	// 	} catch (error) {
	// 		console.error("API请求失败:", error);
	// 	}
	// }
	watch(
		() => props.div1RawData,
		html => {
			if (html) {
				processedTable1.value = parseTableToStandardJSON(html, "表格1");
			}
		},
		{ immediate: true }
	);

	watch(
		() => props.div3RawData,
		html => {
			if (html) {
				processedTable2.value = parseTableToStandardJSON(html, "表格2");
			}
		},
		{ immediate: true }
	);
</script>

<style scoped>
	.compare-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10px;
		box-sizing: border-box;
		overflow: hidden;
	}

	.table-grid {
		display: grid;
		grid-template-columns: minmax(200px, 1fr) minmax(100px, 0.5fr) minmax(
				200px,
				1fr
			);
		width: 98%;
		max-width: 1200px;
		min-width: 320px;
		margin: 0 auto;
		background: white;
		flex: 1;
		overflow-x: auto;
		overflow-y: auto;
		border-collapse: separate;
		border-spacing: 0;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		border-radius: 4px;
	}

	.header {
		padding: 12px;
		background: #2c3e50;
		color: white;
		font-weight: bold;
		text-align: center;
		position: sticky;
		top: 0;
		z-index: 1;
		border-right: 1px solid #475569;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 50px;
		white-space: nowrap;
	}

	.header.middle-column {
		padding: 12px 10px;
		background: #1e293b;
	}

	.cell {
		padding: 10px 5px;
		background: white;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 120px;
		border-bottom: 1px solid #f0f0f0;
		border-right: 1px solid #f0f0f0;
		cursor: pointer;
		text-align: center;
		word-break: break-word;
		overflow: hidden;
		position: relative;
	}

	.chart-wrapper {
		width: 100%;
		height: 80px;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}

	.middle-column {
		background-color: #f8fafc;
		border-right: 1px solid #f0f0f0;
		font-weight: 600;
		min-width: 100px;
	}

	.attribute-name {
		font-weight: 600;
		margin-bottom: 4px;
		color: #2c3e50;
		font-size: clamp(0.9em, 2vw, 1.1em);
		text-align: center;
		width: 100%;
	}

	.stats-summary {
		margin-top: 5px;
		font-size: clamp(0.7rem, 1.5vw, 0.85rem);
		color: #34495e;
		text-align: center;
		line-height: 1.3;
		width: 100%;
		padding: 0 5px;
		box-sizing: border-box;
		overflow: hidden;
		white-space: normal;
	}

	.no-data {
		color: #95a5a6;
		font-style: italic;
		font-size: 0.9em;
		text-align: center;
		width: 100%;
	}

	.full-chart-modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.58);
		z-index: 1000;
		backdrop-filter: blur(5px);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: auto;
		padding: 20px;
		box-sizing: border-box;
	}

	.modal-content {
		background-color: white;
		border-radius: 8px;
		width: 95%;
		max-width: 900px;
		max-height: 85vh;
		overflow: auto;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		padding: 20px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 10px;
		border-bottom: 1px solid #eee;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #64748b;
		transition: color 0.2s;
	}

	.close-button:hover {
		color: #334155;
	}

	@media (max-width: 992px) {
		.table-grid {
			grid-template-columns: minmax(150px, 1fr) minmax(80px, 0.5fr) minmax(
					150px,
					1fr
				);
		}

		.header {
			padding: 10px 8px;
			font-size: 0.95em;
		}
	}

	@media (max-width: 768px) {
		.table-grid {
			grid-template-columns: 1fr;
			width: 100%;
			min-width: auto;
		}

		.header {
			display: flex;
			min-height: 40px;
			font-size: 0.9em;
		}

		.header.middle-column {
			padding: 10px;
		}

		.cell {
			min-height: auto;
			padding: 8px;
			border-right: 1px solid #f0f0f0 !important;
		}

		.left-column,
		.middle-column,
		.right-column {
			border-left: 1px solid #f0f0f0;
		}

		.chart-wrapper {
			height: 70px;
		}

		.stats-summary {
			font-size: 0.7rem;
		}
	}

	@media (max-width: 480px) {
		.compare-container {
			padding: 5px 0;
		}

		.table-grid {
			width: 100%;
			border-radius: 0;
		}

		.attribute-name {
			font-size: 0.95em;
		}

		.chart-wrapper {
			height: 60px;
		}

		.stats-summary {
			font-size: 0.65rem;
		}
	}
</style>
