<template>
	<div id="root">
		<div class="div0" id="div1">
			<!-- <iframe
				ref="frameLeft"
				id="frameLeft"
				src="https://zh.wikipedia.org/wiki/%E5%94%90%E6%9C%9D"
				title="页面1"></iframe> -->
			<!-- 用 v-html 动态绑定加载的 HTML -->
			<div v-html="div1Content"></div>
		</div>

		<div class="div0" id="div2">
			<div class="VisContainer">
				<div class="topContainer">
					<button class="styled-button" @click="showHtml">点击我</button>
				</div>
				<div class="botContainer">
					<!-- 用 v-html 动态绑定加载的 HTML -->
					<div v-html="htmlContent"></div>
				</div>
			</div>
		</div>

		<div class="div0 selectable" id="div3" ref="div3Ref">
			<!-- 动态插入 HTML 内容 -->
			<div v-html="div3Content"></div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, nextTick } from "vue";
	import axios from "axios";
	// import TextSelectionTool from "./textSelectionTool";
	import MouseSelection from "@/js/mouse_selection";

	// 用于存储 HTML 内容
	const htmlContent = ref("");
	const div1Content = ref("");
	const div3Content = ref("");
	const div3Ref = ref(null);

	// 页面初始化时加载内容
	onMounted(async () => {
		const src1 = "http://localhost:8080/baidu/item/%E5%94%90%E6%9C%9D/53699";
		const src2 = "http://localhost:8080/wk/item/%E5%94%90%E6%9C%9D/53699";
		// 获取并加载内容
		await showHtml(src1, div3Content);
		await showHtml(src2, div1Content);
		// 使用 nextTick 确保 v-html 渲染完成后再启动 MouseSelection
		nextTick(() => {
			MouseSelection.start({
				rangeSelector: ".selectable" // 传递范围选择器，支持向下检索
			});
		});
	});

	// 获取并展示内容
	async function showHtml(src, area) {
		try {
			const res = await axios.get(src);
			const html = res.data;
			area.value = htmlToDom(html);
		} catch (err) {
			console.log("请求失败：", err.message);
			area.value = ""; // 如果请求失败，返回空字符串
		}
	}

	// 将 HTML 内容转化为 DOM
	function htmlToDom(html) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		return doc.documentElement.outerHTML;
	}
</script>

<style scoped>
	#root {
		display: flex;
		justify-content: space-around;
		align-items: flex-start;
		height: 100vh;
		margin: 0;
		width: 100%;
	}

	.div0 {
		position: absolute;
		height: 100vh;
	}

	#div1 {
		left: 0;
		width: 30%;
	}

	#div2 {
		width: 40%;
	}

	#div3 {
		width: 30%;
		right: 0;
	}

	iframe {
		width: 100%;
		height: 100%; /* 确保 iframe 的内容充满容器 */
		border: 1px solid #ccc;
		overflow: auto; /* 允许滚动 */
	}

	.selection-box {
		position: absolute;
		border: 2px dashed rgba(0, 0, 255, 0.7); /* 可见的蓝色虚线 */
		background-color: rgba(0, 0, 255, 0.1); /* 半透明蓝色背景 */
		z-index: 9999; /* 确保在最上层显示 */
		pointer-events: none; /* 确保不会影响鼠标事件 */
	}
</style>
