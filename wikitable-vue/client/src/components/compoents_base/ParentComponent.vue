<template>
	<div :class="['div0', selectContentClass]" :id="divId" ref="divRef">
		<h1>{{ pageTitle }}</h1>

		<!-- 加载动画 -->
		<LoadingSpinner v-if="loading" />

		<!-- 错误信息 -->
		<ErrorDisplay
			v-else-if="error"
			:message="error"
			@retry="fetchWikipediaContent" />

		<!-- 文章内容 -->
		<WikipediaContent v-else :content="pageHtml" @select="handleSelection" />

		<!-- 弹出框 -->
		<TextPopup
			:visible="showPopup[divId]"
			:content="selectedText[divId]"
			:containerClass="
				divId === 'div1' ? 'chart-container1' : 'chart-container2'
			"
			:containerRef="divRef"
			@close="closePopup" />

		<!-- 悬浮大纲组件 -->
		<ArticleOutline :content="pageHtml" :divId="divId" />
		<!-- 添加 key 属性 -->
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted, nextTick } from "vue";
	import LoadingSpinner from "./LoadingSpinner.vue";
	import ErrorDisplay from "./ErrorDisplay.vue";
	import WikipediaContent from "./WikipediaContent.vue";
	import TextPopup from "./TextPopup.vue";
	import ArticleOutline from "./ArticleOutline.vue"; // 引入大纲组件
	import * as d3 from "d3";
	import bus from "@/js/eventBus.js";

	const props = defineProps({
		pageTitle: String,
		divId: String,
		selectContentClass: String,
		linkedOutline: Array
	});

	const pageHtml = ref(""); // 文章 HTML 内容
	const loading = ref(true); // 加载状态
	const error = ref(""); // 错误信息
	const selectedText = ref({}); // 存储每个 div 的选中内容
	const showPopup = ref({}); // 存储每个 div 的弹窗显示状态
	const divRef = ref(null); // `Div1` 或 `Div3` 的 DOM 参考

	// **获取 Wikipedia 页面**
	const fetchWikipediaContent = async () => {
		try {
			const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(
				props.pageTitle
			)}`;
			const response = await fetch(apiUrl);
			if (!response.ok) throw new Error("Failed to fetch data");

			const html = await response.text();

			// 解析 HTML
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");

			// **给所有 h1-h6 添加唯一 ID**
			const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
			headings.forEach((heading, index) => {
				const uniqueId = `heading-${index}-${props.divId}`;
				heading.id = uniqueId;
			});

			// **给所有表格添加类名 custom-table**
			const tables = doc.querySelectorAll("table");
			tables.forEach(table => {
				table.classList.add("custom-table");
			});

			// 动态注入 Wikipedia 样式
			const styles = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
			styles.forEach(link => {
				if (!document.querySelector(`link[href="${link.href}"]`)) {
					const styleTag = document.createElement("link");
					styleTag.rel = "stylesheet";
					styleTag.href = link.href;
					document.head.appendChild(styleTag);
				}
			});

			// 仅获取正文部分
			const contentElement = doc.querySelector("body");
			if (!contentElement) throw new Error("Content not found");

			pageHtml.value = contentElement.innerHTML;

			// 手动引入 Wikipedia CSS
			injectWikipediaStyles();
		} catch (err) {
			error.value = "Error fetching Wikipedia content: " + err.message;
		} finally {
			loading.value = false;
		}
	};

	// **手动引入 Wikipedia CSS**
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

	// **处理选中内容**
	const extractLinkedChapterContent = (sourceId, sourceContainerId) => {
		// console.log("Extracting linked chapter content for:", sourceId); // 调试日志

		// 检查 linkedOutline 是否存在
		if (!props.linkedOutline) {
			console.error("LinkedOutline is undefined!");
			return { linkedItem: null, chapterContent: "" };
		}

		// 找到关联章节的 ID
		const linkedItem = props.linkedOutline.find(
			linked => linked.leftId === sourceId || linked.rightId === sourceId
		);
		if (!linkedItem) {
			// console.log("No linked chapter found for sourceId:", sourceId); // 调试日志
			return { linkedItem: null, chapterContent: "" };
		}

		// 确定目标容器和目标章节 ID
		const targetContainerId = sourceContainerId === "div1" ? "div3" : "div1";
		const targetId =
			sourceContainerId === "div1" ? linkedItem.rightId : linkedItem.leftId;

		// 提取目标章节的整个内容
		const targetContainer = document.getElementById(targetContainerId);
		if (!targetContainer) return { linkedItem: null, chapterContent: "" };

		const targetElement = targetContainer.querySelector(`#${targetId}`);
		if (!targetElement) return { linkedItem: null, chapterContent: "" };

		// 提取从当前标题到下一个同级标题之前的所有内容
		let chapterContent = "";
		let currentNode = targetElement;

		while (currentNode) {
			// 如果遇到下一个同级标题，停止提取
			if (
				currentNode !== targetElement &&
				currentNode.nodeType === Node.ELEMENT_NODE &&
				/^h[1-6]$/i.test(currentNode.tagName)
			) {
				break;
			}

			// 将内容添加到章节内容中
			if (
				currentNode.nodeType === Node.ELEMENT_NODE ||
				currentNode.nodeType === Node.TEXT_NODE
			) {
				chapterContent += currentNode.outerHTML || currentNode.textContent;
			}

			currentNode = currentNode.nextSibling;
		}

		// console.log("Extracted content:", chapterContent); // 调试日志
		return { linkedItem, chapterContent };
	};
	// **处理选中内容**
	const handleSelection = content => {
		// 检查选择的内容是否为表格
		const isTable = /<table.*?>.*?<\/table>/s.test(content);
		// console.log("Is table:", isTable); // 调试日志

		// 获取选中的元素
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			console.error("No selection found!"); // 调试日志
			return;
		}

		// 获取选中的范围
		const range = selection.getRangeAt(0);

		// 获取选择范围内的所有元素
		const selectedNodes = range.cloneContents().childNodes;
		// console.log("Selected nodes:", selectedNodes); // 调试日志

		// 遍历选择范围内的所有元素，找到第一个标题元素
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

		// 如果未找到标题元素，尝试从选中范围的起始位置向上查找
		if (!sourceId) {
			let startElement = range.startContainer;
			while (startElement && !/^h[1-6]$/i.test(startElement.tagName)) {
				startElement = startElement.parentElement;
			}
			sourceId = startElement ? startElement.id : undefined;
		}

		// console.log("Extracted source ID:", sourceId); // 调试日志

		// 如果没有找到标题元素，直接弹出所选内容
		if (!sourceId) {
			// console.log("No heading element found, showing selected content only."); // 调试日志
			selectedText.value[props.divId] = content;
			console.log(`${props.divId}选中的文字###:`, content);
			// 传递选中内容
			bus.emit(`${props.divId}_Event`, { content });
			showPopup.value[props.divId] = true;

			// 确保弹窗位置更新
			nextTick(() => {
				updatePopupPosition();
			});
			return;
		}

		// 调用 handleSelectionWithSourceId 方法
		handleSelectionWithSourceId(content, sourceId, isTable);
	};

	const handleSelectionWithSourceId = (content, sourceId, isTable) => {
		// console.log("Selected content:", content); // 调试日志
		// console.log("Source ID:", sourceId); // 调试日志
		// console.log("Is table:", isTable); // 调试日志

		// 存储选中内容
		selectedText.value[props.divId] = content;
		console.log(`${props.divId}选中的文字###:`, content);
		// 传递选中内容
		bus.emit(`${props.divId}_Event`, { content });
		showPopup.value[props.divId] = true;

		// 如果是表格，检查是否有关联章节
		if (isTable) {
			// 提取关联章节的整个内容和 linkedItem
			const { linkedItem, chapterContent } = extractLinkedChapterContent(
				sourceId,
				props.divId
			);
			// console.log("Linked chapter content:", chapterContent); // 调试日志

			// 如果有关联章节内容
			if (linkedItem && chapterContent) {
				// 通知另一个容器弹出关联章节内容
				const otherContainerId = props.divId === "div1" ? "div3" : "div1";
				const targetId =
					props.divId === "div1" ? linkedItem.rightId : linkedItem.leftId;

				// 先滚动到关联章节
				const targetElement = document.getElementById(targetId);
				if (targetElement) {
					targetElement.scrollIntoView({ behavior: "smooth" });
				}

				console.log(`${otherContainerId}选中的文字???:`, chapterContent);
				// 传递选中内容
				bus.emit(`${otherContainerId}_Event`, { content: chapterContent });
				// 再弹出关联章节内容
				bus.emit(`${otherContainerId}Event`, {
					content: chapterContent, // 传递关联章节内容
					sourceId: sourceId
				});
			} else {
				// console.log("No linked chapter found, skipping auto-popup."); // 调试日志
			}
		}

		// 确保弹窗位置更新
		nextTick(() => {
			updatePopupPosition();
		});
	};

	// **关闭弹出框**
	const closePopup = () => {
		showPopup.value[props.divId] = false; // 根据 divId 关闭弹窗
		selectedText.value[props.divId] = ""; // 根据 divId 清除选中内容

		// 根据 divId 清空对应的容器
		const container =
			props.divId === "div1" ? ".chart-container1" : ".chart-container2";
		d3.select(container).html("");
	};

	// **更新遮罩层和弹出框的位置**
	const updatePopupPosition = () => {
		if (showPopup.value[props.divId] && divRef.value) {
			const popup = divRef.value.querySelector(".text-popup");
			const overlay = divRef.value.querySelector(".overlay");
			if (popup && overlay) {
				const rect = divRef.value.getBoundingClientRect();
				const scrollTop = divRef.value.scrollTop;
				const scrollLeft = divRef.value.scrollLeft;

				// 动态调整遮罩层和弹出框的位置
				overlay.style.top = `${scrollTop}px`;
				overlay.style.left = `${scrollLeft}px`;
				overlay.style.width = `${divRef.value.clientWidth}px`;
				overlay.style.height = `${divRef.value.clientHeight}px`;

				popup.style.top = `${rect.height / 2 + scrollTop}px`;
				popup.style.left = `${rect.width / 2 + scrollLeft}px`;
			}
		}
	};

	// **组件挂载后加载 Wikipedia 内容**
	onMounted(() => {
		// 确保 divRef 已初始化
		if (divRef.value) {
			// console.log("divRef 已绑定到 DOM 元素:", divRef.value);
		} else {
			// console.error("divRef 未绑定到 DOM 元素");
		}
		fetchWikipediaContent();

		// 监听父容器滚动事件
		if (divRef.value) {
			divRef.value.addEventListener("scroll", updatePopupPosition);
		}
		// 监听另一个容器的事件
		bus.on(`${props.divId}Event`, ({ content, sourceId }) => {
			// console.log("Received event:", content, sourceId); // 调试日志

			// 存储关联章节内容
			selectedText.value[props.divId] = content;
			showPopup.value[props.divId] = true;

			// 确保弹窗位置更新
			nextTick(() => {
				updatePopupPosition();
			});
		});
	});

	// **组件卸载时解绑事件**
	onUnmounted(() => {
		// 解绑父容器滚动事件
		if (divRef.value) {
			divRef.value.removeEventListener("scroll", updatePopupPosition);
		}
		bus.off(`${props.divId}Event`);
	});
</script>

<style scoped>
	h1 {
		text-align: center;
	}

	/* 文章容器 */
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
	}

	.showHtml {
		width: 100%;
		height: 100%;
		overflow: auto;
	}

	/* 选中文本的高亮样式 */
	::selection {
		background-color: yellow;
		color: black;
	}
</style>
