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
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted, nextTick } from "vue";
	import LoadingSpinner from "./LoadingSpinner.vue";
	import ErrorDisplay from "./ErrorDisplay.vue";
	import WikipediaContent from "./WikipediaContent.vue";
	import TextPopup from "./TextPopup.vue";
	import * as d3 from "d3";
	import bus from "@/js/eventBus.js";
	import {
		renderLineChart,
		renderBarChart,
		renderPieChart,
		renderNonVisualChart,
		renderRadarChart,
		renderStackedBarChart
	} from "@/js/chartUtils";

	const props = defineProps({
		pageTitle: String,
		divId: String,
		selectContentClass: String
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
	const handleSelection = content => {
		// 如果弹出框已经显示并且有内容，则不更新
		if (showPopup.value[props.divId] && selectedText.value[props.divId]) {
			console.log("弹出框中已有内容，不更新");
			return;
		}

		selectedText.value[props.divId] = content; // 根据 divId 存储选中内容
		console.log(`${props.divId}选中的文字###:`, content);
		// 传递选中内容
		bus.emit(`${props.divId}Event`, { content });
		showPopup.value[props.divId] = true; // 根据 divId 显示弹窗

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
			console.log("divRef 已绑定到 DOM 元素:", divRef.value);
		} else {
			console.error("divRef 未绑定到 DOM 元素");
		}
		fetchWikipediaContent();

		// 监听父容器滚动事件
		if (divRef.value) {
			divRef.value.addEventListener("scroll", updatePopupPosition);
		}
	});

	// **组件卸载时解绑事件**
	onUnmounted(() => {
		// 解绑父容器滚动事件
		if (divRef.value) {
			divRef.value.removeEventListener("scroll", updatePopupPosition);
		}
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
