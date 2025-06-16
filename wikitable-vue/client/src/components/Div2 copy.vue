<template>
	<div class="main-container">
		<div class="chat-container">
			<div class="chat-history">
				<div
					v-for="(message, index) in chatHistory"
					:key="index"
					:class="['message', message.role, { error: message.error }]">
					<div class="message-content" v-html="message.content"></div>
					<CausalFlowChart
						v-if="message.isCausalFlow"
						:chains="message.causalChains"
						class="causal-flow-container" />
				</div>
				<div v-if="isLoading" class="loading-indicator">
					<div class="loading-spinner"></div>
					正在处理中...
				</div>
				<div v-if="showSuggestedQuestion" class="suggested-question">
					<div class="suggestion-text">建议深入分析的问题：</div>
					<div class="suggestion-content" @click="useSuggestedQuestion">
						{{ suggestedQuestion }}
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
		<div class="input-area">
			<div class="input-container">
				<textarea
					v-model="userQuestion"
					rows="2"
					placeholder="请输入你想问的问题..."
					:disabled="isLoading"></textarea>
				<div class="button-container">
					<button @click="askQuestion" :disabled="isLoading">
						{{ isLoading ? "处理中..." : "发送" }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
	import bus from "@/js/eventBus.js";
	import CompareTable from "@/components/compoents_base/CompareTable.vue";
	import CausalFlowChart from "@/components/compoents_base/CausalFlowChart.vue";

	const PRESERVED_FIELDS_BY_SECTION = {
		Statistics: [
			"Population",
			"GDP",
			"GDP rank",
			"GDP growth",
			"GDP per capita",
			"GDP per capita rank",
			"GDP by sector",
			"Inflation (CPI)",
			"Population below poverty line",
			"Gini coefficient",
			"Human Development Index",
			"Corruption Perceptions Index",
			"Labor force",
			"Labor force by occupation",
			"Unemployment",
			"Average gross salary",
			"Average net salary",
			"Main industries"
		],
		"Public finances": [
			"Government debt",
			"Foreign reserves",
			"Budget balance",
			"Revenues",
			"Expenses",
			"Economic aid",
			"Credit rating"
		]
	};

	const userQuestion = ref("");
	const chatHistory = ref([]);
	const selectText2 = ref("");
	const selectText3 = ref("");
	const div1RawData = ref(null);
	const div3RawData = ref(null);
	const isLoading = ref(false);
	const div1InfoboxData = ref(null);
	const div3InfoboxData = ref(null);
	const showSuggestedQuestion = ref(false);
	const suggestedQuestion = ref("");
	const currentFieldKey = ref("");
	const leftData = ref(null);
	const rightData = ref(null);

	const loadChatHistory = () => {
		const saved = localStorage.getItem("chatHistory");
		if (saved) {
			try {
				// chatHistory.value = JSON.parse(saved);
			} catch (e) {
				console.error("加载聊天记录失败:", e);
			}
		}
	};

	watch(
		chatHistory,
		newVal => {
			localStorage.setItem("chatHistory", JSON.stringify(newVal));
		},
		{ deep: true }
	);

	const scrollToBottom = () => {
		nextTick(() => {
			const container = document.querySelector(".chat-history");
			if (container) {
				container.scrollTop = container.scrollHeight;
			}
		});
	};

	const getLastAnalysis = () => {
		const reversed = [...chatHistory.value].reverse();
		const lastAssistantMsg = reversed.find(
			msg => msg.role === "assistant" && !msg.error
		);
		return lastAssistantMsg ? lastAssistantMsg.content : "";
	};

	const handleDiv1Event = data => handleSelection(data, "div1");
	const handleDiv3Event = data => handleSelection(data, "div3");

	onMounted(() => {
		loadChatHistory();
		bus.on("div1_Event", handleDiv1Event);
		bus.on("div3_Event", handleDiv3Event);
		bus.on("div1_InfoboxData", data => {
			div1InfoboxData.value = data;
		});
		bus.on("div3_InfoboxData", data => {
			div3InfoboxData.value = data;
		});
	});

	onUnmounted(() => {
		bus.off("div1_Event", handleDiv1Event);
		bus.off("div3_Event", handleDiv3Event);
		bus.off("div1_InfoboxData");
		bus.off("div3_InfoboxData");
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

	const formatAnalysisResult = text => {
		if (!text) return "";

		text = text
			.replace(/^# (.*$)/gm, "<h1>$1</h1>")
			.replace(/^## (.*$)/gm, "<h2>$1</h2>")
			.replace(/^### (.*$)/gm, "<h3>$1</h3>")
			.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
			.replace(/\*(.*?)\*/g, "<em>$1</em>")
			.replace(/`(.*?)`/g, "<code>$1</code>")
			.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2">')
			.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
			.replace(/(?:^|\n)\d+\.\s+(.*)/g, "<li>$1</li>")
			.replace(/(?:^|\n)-\s+(.*)/g, "<li>$1</li>")
			.replace(/(?:^|\n)\>\s+(.*)/g, "<blockquote>$1</blockquote>")
			.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
			.replace(/\n\n/g, "<br><br>")
			.replace(/\n/g, "<br>");

		return `<div class="markdown-content">${text}</div>`;
	};

	const extractEssentialData = fieldData => {
		if (!fieldData) return null;

		const essential = {
			value: fieldData.value,
			type: fieldData.type
		};

		if (fieldData.unit) essential.unit = fieldData.unit;
		if (fieldData.currency) essential.currency = fieldData.currency;
		if (fieldData.extracted) essential.raw = fieldData.raw;

		return essential;
	};

	const simplifyInfobox = infobox => {
		if (!infobox) return {};

		const result = {
			title: infobox.title,
			type: infobox.type
		};

		if (infobox.sections) {
			result.sections = {};

			Object.entries(infobox.sections).forEach(([sectionName, sectionData]) => {
				if (PRESERVED_FIELDS_BY_SECTION[sectionName]) {
					result.sections[sectionName] = {};

					PRESERVED_FIELDS_BY_SECTION[sectionName].forEach(fieldName => {
						if (sectionData[fieldName]) {
							if (Array.isArray(sectionData[fieldName])) {
								result.sections[sectionName][fieldName] = sectionData[
									fieldName
								].map(item => extractEssentialData(item));
							} else {
								result.sections[sectionName][fieldName] = extractEssentialData(
									sectionData[fieldName]
								);
							}
						}
					});
				}
			});
		}
		return result;
	};

	const parseCausalChains = text => {
		const chains = [];
		const countries = text.split("##").filter(s => s.trim());

		countries.forEach(countrySection => {
			const countryMatch = countrySection.match(/(韩国|日本)/);
			if (!countryMatch) return;

			const country = countryMatch[0] === "韩国" ? "korea" : "japan";
			const chainContent = countrySection.replace(/^.*?\n/, "").trim();

			const steps = chainContent
				.split("→")
				.map(step => {
					const cleanStep = step.trim();
					const evidenceMatch = cleanStep.match(/\((.*?)\)/);
					const textPart = evidenceMatch
						? cleanStep.replace(evidenceMatch[0], "").trim()
						: cleanStep;

					return {
						text: textPart,
						evidence: evidenceMatch ? evidenceMatch[1] : null
					};
				})
				.filter(step => step.text);

			if (steps.length > 0) {
				chains.push({
					country,
					steps: steps.slice(0, 6)
				});
			}
		});

		return chains;
	};

	const askQuestion = async () => {
		if (!userQuestion.value.trim()) {
			chatHistory.value.push({
				role: "assistant",
				content: "问题不能为空",
				timestamp: new Date().toLocaleString(),
				error: true
			});
			return;
		}

		const question = userQuestion.value;
		chatHistory.value.push({
			role: "user",
			content: question,
			timestamp: new Date().toLocaleString()
		});
		userQuestion.value = "";
		showSuggestedQuestion.value = false;

		isLoading.value = true;

		try {
			if (
				currentFieldKey.value &&
				question.includes("请结合其他属性深入分析得出上述结论的原因")
			) {
				// followUp: true
				await api.post(
					"compare_attributes",
					{
						chartData: {
							leftData: leftData.value,
							rightData: rightData.value,
							leftTitle: "当前选择",
							rightTitle: "对比选择",
							fieldKey: currentFieldKey.value,
							leftInfobox: simplifyInfobox(div1InfoboxData.value),
							rightInfobox: simplifyInfobox(div3InfoboxData.value)
						},
						chartType: "comparison",
						followUp: true,
						previousAnalysis: getLastAnalysis()
					},
					response => {
						// console.log("resp:", response.analysis);
						const res = JSON.parse(response.analysis); // 关键点：将字符串转为对象
						chatHistory.value.push({
							role: "assistant",
							content: "以下是因果分析：",
							isCausalFlow: true,
							causalChains: res,
							timestamp: new Date().toLocaleString()
						});
						scrollToBottom();
					},
					error => {
						throw error;
					}
				);
			} else {
				// 处理一般问题
				await api.post(
					"ask_infobox",
					{
						question: question,
						leftInfobox: simplifyInfobox(div1InfoboxData.value),
						rightInfobox: simplifyInfobox(div3InfoboxData.value)
					},
					response => {
						const formattedAnswer = formatAnalysisResult(response.answer);
						chatHistory.value.push({
							role: "assistant",
							content: formattedAnswer,
							timestamp: new Date().toLocaleString()
						});
						scrollToBottom();
					},
					error => {
						throw error;
					}
				);
			}
		} catch (error) {
			console.error("请求失败:", error);
			chatHistory.value.push({
				role: "assistant",
				content: `请求失败: ${error.message || "未知错误"}`,
				timestamp: new Date().toLocaleString(),
				error: true
			});
		} finally {
			isLoading.value = false;
			scrollToBottom();
		}
	};

	const useSuggestedQuestion = () => {
		userQuestion.value = suggestedQuestion.value;
		showSuggestedQuestion.value = false;
		nextTick(() => {
			document.querySelector(".input-container textarea").focus();
		});
	};

	const handleAttributeComparison = async ({
		fieldKey,
		leftData: incomingLeftData,
		rightData: incomingRightData,
		leftTitle,
		rightTitle,
		fieldType,
		fieldLabel
	}) => {
		if (!incomingLeftData || !incomingRightData) {
			chatHistory.value.push({
				role: "assistant",
				content: "请先选择要对比的数据",
				timestamp: new Date().toLocaleString(),
				error: true
			});
			return;
		}

		leftData.value = incomingLeftData;
		rightData.value = incomingRightData;
		currentFieldKey.value = fieldKey;

		isLoading.value = true;

		try {
			chatHistory.value.push({
				role: "assistant",
				content: `正在对比分析<strong>${fieldKey}</strong>属性...`,
				timestamp: new Date().toLocaleString()
			});

			const requestPayload = {
				chartData: {
					leftData: leftData.value,
					rightData: rightData.value,
					leftTitle,
					rightTitle,
					fieldKey,
					fieldType,
					allFields: Object.keys({
						...div1InfoboxData.value,
						...div3InfoboxData.value
					}),
					leftInfobox: simplifyInfobox(div1InfoboxData.value),
					rightInfobox: simplifyInfobox(div3InfoboxData.value)
				},
				chartType: "comparison"
			};

			await api.post(
				"compare_attributes",
				requestPayload,
				response => {
					console.log("resp:", response);
					const formattedAnalysis = formatAnalysisResult(response.analysis);
					chatHistory.value.push({
						role: "assistant",
						content: formattedAnalysis,
						timestamp: new Date().toLocaleString()
					});

					suggestedQuestion.value = `请结合其他属性深入分析得出上述结论的原因`;
					showSuggestedQuestion.value = true;
					scrollToBottom();
				},
				error => {
					throw error;
				}
			);
		} catch (error) {
			console.error("对比分析失败:", error);
			chatHistory.value.push({
				role: "assistant",
				content: `对比分析失败: ${error.message || "未知错误"}`,
				timestamp: new Date().toLocaleString(),
				error: true
			});
		} finally {
			isLoading.value = false;
			scrollToBottom();
		}
	};
</script>

<style scoped>
	.main-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f5f7fa;
		overflow: hidden;
	}

	.chat-container {
		height: 45vh;
		min-height: 40vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		margin: 10px;
	}

	.chat-history {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		scroll-behavior: smooth;
		border: 1px solid #e0e0e0;
	}

	.vis-container {
		height: 35vh;
		min-height: 41vh;
		padding: 10px;
		background: #ffffff;
		border-radius: 12px;
		margin: 0 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
		overflow: auto;
		border: 1px solid #e0e0e0;
	}

	.compare-table {
		width: 100%;
		height: 100%;
	}

	.input-area {
		height: 15vh;
		min-height: 15vh;
		padding: 15px;
		background: #ffffff;
		border-top: 1px solid #e0e0e0;
		flex-shrink: 0;
	}

	.message {
		margin-bottom: 20px;
		padding: 15px 20px;
		border-radius: 12px;
		line-height: 1.6;
		position: relative;
		max-width: 85%;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.message.user {
		background: #e3f2fd;
		margin-left: auto;
		border-bottom-right-radius: 4px;
		border: 1px solid #bbdefb;
	}

	.message.assistant {
		background: #f8f9fa;
		margin-right: auto;
		border-bottom-left-radius: 4px;
		border: 1px solid #e0e0e0;
	}

	.message.error {
		background: #ffebee;
		border-left: 4px solid #f44336;
	}

	.message-content {
		word-wrap: break-word;
	}

	.input-container {
		display: flex;
		flex-direction: column;
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		height: 100%;
		border: 1px solid #e0e0e0;
	}

	.input-container textarea {
		width: 100%;
		padding: 12px 16px;
		border: none;
		border-radius: 12px;
		resize: none;
		font-size: 14px;
		outline: none;
		background: #f9f9f9;
	}

	.input-container textarea:focus {
		background: #ffffff;
	}

	.button-container {
		display: flex;
		justify-content: flex-end;
		padding: 8px;
	}

	.button-container button {
		background: #4285f4;
		color: white;
		border: none;
		padding: 8px 20px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.button-container button:hover {
		background: #3367d6;
		transform: translateY(-1px);
	}

	.button-container button:disabled {
		background: #b3c6e0;
		cursor: not-allowed;
		transform: none;
	}

	.loading-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 15px;
		color: #666;
		font-size: 14px;
	}

	.loading-spinner {
		border: 3px solid rgba(66, 133, 244, 0.2);
		border-radius: 50%;
		border-top: 3px solid #4285f4;
		width: 20px;
		height: 20px;
		animation: spin 1s linear infinite;
		margin-right: 10px;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.markdown-content {
		line-height: 1.7;
		font-size: 15px;
		color: #333;
	}

	.markdown-content h1 {
		font-size: 1.5em;
		margin: 20px 0 15px;
		padding-bottom: 5px;
		border-bottom: 1px solid #eee;
		color: #2c3e50;
	}

	.markdown-content h2 {
		font-size: 1.3em;
		margin: 18px 0 12px;
		color: #34495e;
	}

	.markdown-content h3 {
		font-size: 1.1em;
		margin: 15px 0 10px;
		color: #4285f4;
	}

	.markdown-content ul,
	.markdown-content ol {
		padding-left: 25px;
		margin: 12px 0;
	}

	.markdown-content li {
		margin-bottom: 8px;
		position: relative;
	}

	.markdown-content ul li::before {
		content: "•";
		color: #4285f4;
		position: absolute;
		left: -15px;
	}

	.markdown-content strong {
		color: #2c3e50;
		font-weight: 600;
	}

	.markdown-content em {
		color: #666;
		font-style: italic;
	}

	.markdown-content code {
		background: rgba(66, 133, 244, 0.1);
		padding: 2px 6px;
		border-radius: 4px;
		font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
		font-size: 0.9em;
		color: #d63384;
	}

	.markdown-content blockquote {
		border-left: 3px solid #4285f4;
		padding: 10px 15px;
		margin: 15px 0;
		background: rgba(66, 133, 244, 0.05);
		color: #555;
	}

	.markdown-content a {
		color: #4285f4;
		text-decoration: none;
		font-weight: 500;
	}

	.markdown-content a:hover {
		text-decoration: underline;
	}

	.suggested-question {
		margin: 15px 0;
		padding: 12px;
		background-color: #f5f7fa;
		border-radius: 8px;
		border: 1px dashed #4285f4;
		cursor: pointer;
		transition: all 0.2s;
	}

	.suggested-question:hover {
		background-color: #e8f0fe;
	}

	.suggestion-text {
		font-size: 12px;
		color: #666;
		margin-bottom: 5px;
	}

	.suggestion-content {
		color: #4285f4;
		font-weight: 500;
		padding: 5px;
		border-radius: 4px;
	}

	.causal-flow-container {
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		padding: 0 5px;
		margin-top: 15px;
		margin-bottom: 5px;
	}

	@media (max-width: 768px) {
		.chat-container {
			height: 45vh;
			min-height: 45vh;
		}

		.vis-container {
			height: 35vh;
			min-height: 35vh;
		}

		.input-area {
			height: 20vh;
			min-height: 20vh;
		}

		.message {
			max-width: 90%;
			padding: 12px 15px;
		}
	}
</style>
