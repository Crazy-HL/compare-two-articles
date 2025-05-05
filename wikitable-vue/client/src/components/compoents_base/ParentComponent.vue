<template>
	<div :class="['div0', selectContentClass]" :id="divId" ref="divRef">
		<h1>{{ props.pageTitle }}</h1>

		<LoadingSpinner v-if="loading" />

		<ErrorDisplay
			v-else-if="error"
			:message="error"
			@retry="fetchWikipediaContent" />

		<WikipediaContent v-else :content="pageHtml" @select="handleSelection" />

		<TextPopup
			:visible="showPopup[divId]"
			:content="selectedText[divId]"
			:containerClass="
				divId === 'div1' ? 'chart-container1' : 'chart-container2'
			"
			:containerRef="divRef"
			@close="closePopup" />

		<ArticleOutline :content="pageHtml" :divId="divId" />
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted, nextTick } from "vue";
	import LoadingSpinner from "./LoadingSpinner.vue";
	import ErrorDisplay from "./ErrorDisplay.vue";
	import WikipediaContent from "./WikipediaContent.vue";
	import TextPopup from "./TextPopup.vue";
	import ArticleOutline from "./ArticleOutline.vue";
	import * as d3 from "d3";
	import bus from "@/js/eventBus.js";
	import { parseInfoboxForComparison } from "@/js/wikiInfoboxParser";
	import api from "@/api";

	const props = defineProps({
		pageTitle: String,
		divId: String,
		selectContentClass: String,
		linkedOutline: Array
	});

	// 原有状态
	const pageHtml = ref("");
	const loading = ref(true);
	const error = ref("");
	const selectedText = ref({});
	const showPopup = ref({});
	const divRef = ref(null);
	const highlightedParagraphs = ref({});
	const MainTextContent = ref("");

	// 新增配置：区分左右维基的精确高亮文本
	const exactHighlightTexts = {
		div1: {
			// 左侧维基百科
			GDP: [
				"China is also the world's largest consumer of numerous commodities, and accounts for about half of global consumption of metals",
				"China has bilateral free trade agreements with many nations and is a member of the Regional Comprehensive Economic Partnership (RCEP)."
			],
			Population: ["1.4 billion", "population census"]
		},
		div3: {
			// 右侧维基百科
			GDP: [
				"The American Reinvestment and Recovery Act was enacted by the United States Congress, and in the ensuing years the U.S. experienced the longest economic expansion on record by July 2019"
			],
			Population: ["330 million", "population density"]
		}
	};

	// async function parseInfobox(html) {
	// 	try {
	// 		api.post("parse", { html }, data => {
	// 			console.log("infodata:", data);
	// 		});
	// 	} catch (error) {
	// 		console.error("Error parsing infobox:", error);
	// 		return null;
	// 	}
	// }
	// 原有方法 - 完全保留
	const fetchWikipediaContent = async () => {
		try {
			const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(
				props.pageTitle
			)}`;
			const response = await fetch(apiUrl);
			if (!response.ok) throw new Error("Failed to fetch data");

			const html = await response.text();
			const MainTextContent = cleanWikipediaContent(html); // 直接获取纯文本
			console.log(MainTextContent);
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");

			const infobox = doc.querySelector(".infobox, .sidebar, .toccolours");
			const comparisonData = parseInfoboxForComparison(infobox);

			// if (infobox) {
			//     const parsedData = await parseInfobox(infobox);
			//     console.log("Final parsed data:", parsedData);
			//     bus.emit(`${props.divId}_InfoboxData`, parsedData || comparisonData);
			// } else {
			//     console.warn("No infobox found in the document");
			//     bus.emit(`${props.divId}_InfoboxData`, comparisonData);
			// }
			const sidebar = doc.querySelector(".sidebar");
			if (sidebar) sidebar.remove();

			bus.emit(`${props.divId}_InfoboxData`, comparisonData);

			const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
			headings.forEach((heading, index) => {
				const uniqueId = `heading-${index}-${props.divId}`;
				heading.id = uniqueId;
			});

			const tables = doc.querySelectorAll("table");
			tables.forEach(table => {
				table.classList.add("custom-table");
			});

			const styles = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
			styles.forEach(link => {
				if (!document.querySelector(`link[href="${link.href}"]`)) {
					const styleTag = document.createElement("link");
					styleTag.rel = "stylesheet";
					styleTag.href = link.href;
					document.head.appendChild(styleTag);
				}
			});

			const contentElement = doc.querySelector("body");
			if (!contentElement) throw new Error("Content not found");

			pageHtml.value = contentElement.innerHTML;
			injectWikipediaStyles();

			bus.emit(`${props.divId}_FullContent`, {
				content: pageHtml.value,
				title: props.pageTitle
			});
		} catch (err) {
			error.value = "Error fetching Wikipedia content: " + err.message;
			console.error("获取维基百科内容失败:", err);
		} finally {
			loading.value = false;
		}
	};

	const cleanWikipediaContent = html => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");

		// 移除不需要的元素（Infobox、参考文献、目录等）
		const selectorsToRemove = [
			".infobox",
			".sidebar",
			".toc",
			".reflist",
			".hatnote",
			".navbox",
			".mw-editsection",
			"table.ambox",
			".shortdescription",
			"img",
			"figure"
		];

		selectorsToRemove.forEach(selector => {
			doc.querySelectorAll(selector).forEach(el => el.remove());
		});

		// 提取正文部分（通常是 #bodyContent 或 #mw-content-text）
		const bodyContent =
			doc.querySelector("#bodyContent, #mw-content-text") || doc.body;

		// 获取纯文本并优化格式
		let plainText = bodyContent.textContent || bodyContent.innerText;

		// 格式化文本：合并多余换行和空格
		plainText = plainText
			.replace(/\s+/g, " ") // 将多个空格/换行符替换为单个空格
			.replace(/\[\d+\]/g, "") // 移除维基百科的引用标记（如 [1] [2]）
			.trim();

		return plainText;
	};
	const injectWikipediaStyles = () => {
		const wikipediaStyles = [
			"https://en.wikipedia.org/w/load.php?modules=site.styles",
			"https://en.wikipedia.org/w/load.php?modules=ext.cite.styles",
			"https://en.wikipedia.org/w/load.php?modules=ext.scribunto.styles",
			"https://en.wikipedia.org/w/load.php?modules=skins.vector.styles"
		];

		wikipediaStyles.forEach(url => {
			if (!document.querySelector(`link[href="${url}"]`)) {
				const styleTag = document.createElement("link");
				styleTag.rel = "stylesheet";
				styleTag.href = url;
				document.head.appendChild(styleTag);
			}
		});
	};

	const handleHoverInfobox = ({ fieldKey, infoboxTitle }) => {
		if (props.pageTitle !== infoboxTitle) return;

		const infobox = divRef.value.querySelector(
			".infobox, .sidebar, .toccolours"
		);
		if (!infobox) return;

		clearInfoboxHighlights();

		const rows = infobox.querySelectorAll("tr");
		for (const row of rows) {
			const th = row.querySelector("th");
			if (th && th.textContent.trim() === fieldKey) {
				row.classList.add("infobox-highlight");
				break;
			}
		}
	};

	const handleUnhoverInfobox = () => {
		clearInfoboxHighlights();
	};

	const clearInfoboxHighlights = () => {
		const infobox = divRef.value.querySelector(
			".infobox, .sidebar, .toccolours"
		);
		if (infobox) {
			infobox.querySelectorAll(".infobox-highlight").forEach(row => {
				row.classList.remove("infobox-highlight");
			});
		}
	};

	const handleSelection = content => {
		const isTable = /<table.*?>.*?<\/table>/s.test(content);
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		const selectedNodes = range.cloneContents().childNodes;

		let sourceId = undefined;
		for (const node of selectedNodes) {
			if (
				node.nodeType === Node.ELEMENT_NODE &&
				/^h[1-6]$/i.test(node.tagName)
			) {
				sourceId = node.id;
				break;
			}
		}

		if (!sourceId) {
			let startElement = range.startContainer;
			while (startElement && !/^h[1-6]$/i.test(startElement.tagName)) {
				startElement = startElement.parentElement;
			}
			sourceId = startElement ? startElement.id : undefined;
		}

		if (!sourceId) {
			selectedText.value[props.divId] = content;
			bus.emit(`${props.divId}_Event`, { content });
			showPopup.value[props.divId] = true;
			nextTick(() => {
				updatePopupPosition();
			});
			return;
		}

		handleSelectionWithSourceId(content, sourceId, isTable);
	};

	const handleSelectionWithSourceId = (content, sourceId, isTable) => {
		selectedText.value[props.divId] = content;
		bus.emit(`${props.divId}_Event`, { content });
		showPopup.value[props.divId] = true;

		if (isTable) {
			const { linkedItem, chapterContent } = extractLinkedChapterContent(
				sourceId,
				props.divId
			);

			if (linkedItem && chapterContent) {
				const otherContainerId = props.divId === "div1" ? "div3" : "div1";
				const targetId =
					props.divId === "div1" ? linkedItem.rightId : linkedItem.leftId;

				const targetElement = document.getElementById(targetId);
				if (targetElement) {
					targetElement.scrollIntoView({ behavior: "smooth" });
				}

				bus.emit(`${otherContainerId}_Event`, { content: chapterContent });
				bus.emit(`${otherContainerId}Event`, {
					content: chapterContent,
					sourceId: sourceId
				});
			}
		}

		nextTick(() => {
			updatePopupPosition();
		});
	};

	const closePopup = () => {
		showPopup.value[props.divId] = false;
		selectedText.value[props.divId] = "";
		const container =
			props.divId === "div1" ? ".chart-container1" : ".chart-container2";
		d3.select(container).html("");
	};

	const updatePopupPosition = () => {
		if (showPopup.value[props.divId] && divRef.value) {
			const popup = divRef.value.querySelector(".text-popup");
			const overlay = divRef.value.querySelector(".overlay");
			if (popup && overlay) {
				const rect = divRef.value.getBoundingClientRect();
				const scrollTop = divRef.value.scrollTop;
				const scrollLeft = divRef.value.scrollLeft;

				overlay.style.top = `${scrollTop}px`;
				overlay.style.left = `${scrollLeft}px`;
				overlay.style.width = `${divRef.value.clientWidth}px`;
				overlay.style.height = `${divRef.value.clientHeight}px`;

				popup.style.top = `${rect.height / 2 + scrollTop}px`;
				popup.style.left = `${rect.width / 2 + scrollLeft}px`;
			}
		}
	};

	const extractLinkedChapterContent = (sourceId, sourceContainerId) => {
		if (!props.linkedOutline) {
			return { linkedItem: null, chapterContent: "" };
		}

		const linkedItem = props.linkedOutline.find(
			linked => linked.leftId === sourceId || linked.rightId === sourceId
		);
		if (!linkedItem) {
			return { linkedItem: null, chapterContent: "" };
		}

		const targetContainerId = sourceContainerId === "div1" ? "div3" : "div1";
		const targetId =
			sourceContainerId === "div1" ? linkedItem.rightId : linkedItem.leftId;

		const targetContainer = document.getElementById(targetContainerId);
		if (!targetContainer) {
			return { linkedItem: null, chapterContent: "" };
		}

		const targetElement = targetContainer.querySelector(`#${targetId}`);
		if (!targetElement) {
			return { linkedItem: null, chapterContent: "" };
		}

		let chapterContent = "";
		let currentNode = targetElement;

		while (currentNode) {
			if (
				currentNode !== targetElement &&
				currentNode.nodeType === Node.ELEMENT_NODE &&
				/^h[1-6]$/i.test(currentNode.tagName)
			) {
				break;
			}

			if (
				currentNode.nodeType === Node.ELEMENT_NODE ||
				currentNode.nodeType === Node.TEXT_NODE
			) {
				chapterContent += currentNode.outerHTML || currentNode.textContent;
			}

			currentNode = currentNode.nextSibling;
		}

		return { linkedItem, chapterContent };
	};

	// 修改后的高亮方法
	const highlightParagraphs = fieldKey => {
		clearHighlights();

		if (!divRef.value) return;

		// 获取当前divId对应的配置
		const textsToHighlight = exactHighlightTexts[props.divId]?.[fieldKey] || [];

		// 遍历所有需要高亮的文本
		textsToHighlight.forEach(text => {
			highlightExactText(text);
		});
	};

	// 精确高亮指定文本
	const highlightExactText = textToHighlight => {
		const contentElement = divRef.value.querySelector(".wikipedia-content");
		if (!contentElement || !textToHighlight) return;

		// 使用TreeWalker遍历文本节点
		const walker = document.createTreeWalker(
			contentElement,
			NodeFilter.SHOW_TEXT,
			null,
			false
		);

		let node;
		const matches = [];

		// 第一阶段：收集所有匹配位置
		while ((node = walker.nextNode())) {
			const nodeValue = node.nodeValue;
			let pos = 0;
			while ((pos = nodeValue.indexOf(textToHighlight, pos)) >= 0) {
				matches.push({
					node,
					start: pos,
					end: pos + textToHighlight.length
				});
				pos += textToHighlight.length;
			}
		}

		// 第二阶段：从后往前处理（避免偏移问题）
		matches.reverse().forEach(({ node, start, end }) => {
			const parent = node.parentNode;

			// 分割文本节点
			const before = node.splitText(start);
			const highlighted = before.splitText(end - start);

			// 创建高亮span
			const span = document.createElement("span");
			span.className = `highlight-exact highlight-${props.divId}`;
			span.textContent = before.nodeValue;

			// 替换文本
			parent.replaceChild(span, before);

			// 保存高亮引用
			if (!highlightedParagraphs.value[props.divId]) {
				highlightedParagraphs.value[props.divId] = [];
			}
			highlightedParagraphs.value[props.divId].push(span);
		});

		// 滚动到第一个高亮处
		if (highlightedParagraphs.value[props.divId]?.[0]) {
			highlightedParagraphs.value[props.divId][0].scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
		}
	};

	// 清除高亮
	const clearHighlights = () => {
		if (!highlightedParagraphs.value[props.divId]) return;

		highlightedParagraphs.value[props.divId].forEach(highlight => {
			if (highlight.parentNode) {
				const textNode = document.createTextNode(highlight.textContent);
				highlight.parentNode.replaceChild(textNode, highlight);
			}
		});

		highlightedParagraphs.value[props.divId] = [];
	};

	onMounted(() => {
		fetchWikipediaContent();

		if (divRef.value) {
			divRef.value.addEventListener("scroll", updatePopupPosition);
		}

		const hoverEvent = `hover-${
			props.divId === "div1" ? "left" : "right"
		}-infobox`;
		const unhoverEvent = `unhover-${
			props.divId === "div1" ? "left" : "right"
		}-infobox`;

		bus.on(hoverEvent, handleHoverInfobox);
		bus.on(unhoverEvent, handleUnhoverInfobox);

		bus.on(`${props.divId}Event`, ({ content, sourceId }) => {
			selectedText.value[props.divId] = content;
			showPopup.value[props.divId] = true;
			nextTick(() => {
				updatePopupPosition();
			});
		});

		// 修改事件监听
		bus.on(`highlight-${props.divId}-paragraphs`, highlightParagraphs);
		bus.on(`clear-${props.divId}-highlights`, clearHighlights);
	});

	onUnmounted(() => {
		if (divRef.value) {
			divRef.value.removeEventListener("scroll", updatePopupPosition);
		}

		const hoverEvent = `hover-${
			props.divId === "div1" ? "left" : "right"
		}-infobox`;
		const unhoverEvent = `unhover-${
			props.divId === "div1" ? "left" : "right"
		}-infobox`;

		bus.off(hoverEvent, handleHoverInfobox);
		bus.off(unhoverEvent, handleUnhoverInfobox);
		bus.off(`${props.divId}Event`);

		// 移除事件监听
		bus.off(`highlight-${props.divId}-paragraphs`, highlightParagraphs);
		bus.off(`clear-${props.divId}-highlights`, clearHighlights);
	});
</script>

<style scoped>
	/* 原有样式保持不变 */
	h1 {
		text-align: center;
		margin-bottom: 20px;
		color: #2c3e50;
	}

	.div0 {
		position: relative;
		width: 55%;
		max-width: 100%;
		max-height: 100%;
		overflow: auto;
		padding: 20px;
		background-color: #ffffff;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		margin: 10px;
	}

	#div1,
	#div3 {
		width: 55%;
		max-width: 100%;
		max-height: 100%;
		overflow: auto;
		padding: 20px;
		background-color: #ffffff;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		margin: 10px;
	}

	.showHtml {
		width: 100%;
		height: 100%;
		overflow: auto;
	}

	::selection {
		background-color: rgba(255, 255, 0, 0.3);
		color: inherit;
	}
</style>

<style>
	/* 原有全局样式 */
	.infobox tr.infobox-highlight th,
	.infobox tr.infobox-highlight td,
	.sidebar tr.infobox-highlight th,
	.sidebar tr.infobox-highlight td,
	.toccolours tr.infobox-highlight th,
	.toccolours tr.infobox-highlight td {
		background-color: #fffacd !important;
		box-shadow: 0 0 8px rgba(255, 235, 59, 0.8) !important;
		transition: all 0.15s ease !important;
	}

	/* 新增精确高亮样式 - 区分左右 */
	.highlight-exact.highlight-div1 {
		background-color: rgba(255, 235, 59, 0.6);
		padding: 0 2px;
		border-radius: 3px;
		box-shadow: 0 0 0 1px rgba(255, 235, 59, 0.3);
	}

	.highlight-exact.highlight-div3 {
		background-color: rgba(100, 221, 23, 0.6);
		padding: 0 2px;
		border-radius: 3px;
		box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.3);
	}
</style>
