<template>
	<div class="div0 selectContent2" id="div3">
		<h1>{{ pageTitle }}</h1>
		<div v-if="loading">Loading...</div>
		<div v-else-if="error" class="error">{{ error }}</div>
		<div
			v-else
			class="showHtml wikipedia-content"
			v-html="pageHtml"
			@mouseup="handleSelection"></div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted } from "vue";
	import bus from "@/js/eventBus.js";
	import HighlightText from "@/js/highlight"; // 导入高亮工具包

	const pageTitle = ref("Jimmer Fredette"); // 页面标题
	const pageHtml = ref(""); // 文章 HTML 内容
	const loading = ref(true); // 加载状态
	const error = ref(""); // 错误信息

	// **获取 Wikipedia 页面**
	const fetchWikipediaContent = async () => {
		try {
			const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(
				pageTitle.value
			)}`;
			const response = await fetch(apiUrl);
			if (!response.ok) throw new Error("Failed to fetch data");

			const html = await response.text();

			// 解析 HTML，提取 <link rel="stylesheet">
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, "text/html");

			// **动态注入 Wikipedia 样式**
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

			// **手动引入 Wikipedia 的官方 CSS**
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

	// **高亮用户选中的文字**
	const handleSelection = () => {
		const selection = window.getSelection().toString().trim();
		if (selection) {
			console.log("选中的内容来自 Div3:", selection);
			bus.emit("div3Event", { content: selection }); // 传递包含 content 属性的对象
			HighlightText.highlightSelection(); // 调用高亮工具包中的方法进行高亮
		}
	};

	// **组件挂载后加载 Wikipedia 内容**
	onMounted(() => {
		fetchWikipediaContent();

		// 绑定 div3 的 mouseup 事件
		document
			.querySelector("#div3")
			.addEventListener("mouseup", handleSelection);
	});

	// **组件卸载时解绑事件**
	onUnmounted(() => {
		document
			.querySelector("#div3")
			.removeEventListener("mouseup", handleSelection);
	});
</script>

<style scoped>
	#div3 {
		width: 55%;
		max-width: 100%;
		max-height: 100%;
		overflow: auto;
	}

	.showHtml {
		width: 100%;
		height: 100%;
		border: 1px solid #ccc;
		overflow: auto;
	}

	/* Wikipedia 内容容器 */
	.wikipedia-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		font-family: sans-serif;
		font-size: 0.6vw; /* 根据视口宽度自动调整字体大小 */
	}

	/* 选中文本的高亮样式 */
	::selection {
		background-color: yellow;
		color: black;
	}

	/* 错误信息 */
	.error {
		color: red;
	}

	/* **手动调整表格样式** */
	.wikipedia-content table {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid #ddd;
	}

	.wikipedia-content th,
	.wikipedia-content td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: left;
	}

	.wikipedia-content th {
		background-color: #f2f2f2;
	}
</style>
