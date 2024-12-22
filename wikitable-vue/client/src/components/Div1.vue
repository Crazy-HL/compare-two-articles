<!-- Div1.vue -->
<template>
	<div class="div0 selectContent1" id="div1">
		<div v-html="div1Content" class="showHtml"></div>
	</div>
</template>

<script setup>
	import { ref, onMounted, nextTick } from "vue";
	import MouseSelection from "@/js/mouse_selection";

	// 用于存储 HTML 内容
	const div1Content = ref("");

	// 页面初始化时加载内容
	onMounted(async () => {
		const src = "https://baike.baidu.com/item/%E5%94%90%E6%9C%9D/53699";
		await showHtml(src, div1Content);
		// 使用 nextTick 确保 v-html 渲染完成后再启动 MouseSelection
		nextTick(() => {
			MouseSelection.start({
				rangeSelector: ".selectContent1" // 传递范围选择器，支持向下检索
			});
		});
	});

	// 获取并展示内容
	async function showHtml(src, area) {
		try {
			api.get("html", { url: src }, data => {
				area.value = htmlToDom(data);
			});
			// const res = await axios.get(src);
			// const html = res.data;
			// area.value = htmlToDom(html);
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
	#div1 {
		width: 30%;
		max-width: 100%; /* 限制宽度不超过父容器的宽度 */
		max-height: 100%; /* 限制高度不超过父容器的高度 */
		overflow: auto; /* 如果内容超出，添加滚动条 */
	}

	.showHtml {
		width: 100%;
		height: 100%;
		border: 1px solid #ccc;
		overflow: auto;
	}
</style>
