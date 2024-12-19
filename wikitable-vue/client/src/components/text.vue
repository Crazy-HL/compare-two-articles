<template>
	<div id="root">
		<div class="div0" id="div1">
			<iframe
				ref="frameLeft"
				id="frameLeft"
				src="https://zh.wikipedia.org/wiki/%E5%94%90%E6%9C%9D"
				title="页面1"></iframe>
		</div>

		<div class="div0" id="div2">
			<div class="VisContainer">
				<div class="topContainer">
					<button class="styled-button" @click="tang">点击我</button>
				</div>
				<div class="botContainer"></div>
			</div>
		</div>

		<div class="div0" id="div3">
			<iframe
				id="frameRight"
				src="https://baike.baidu.com/item/%E5%94%90%E6%9C%9D/53699"
				title="页面2"></iframe>
		</div>
	</div>
</template>

<script setup>
	import axios from "axios";
	import { onMounted } from "vue";
	onMounted(async () => {
		document.getElementById("div3").innerHTML = await tang();
	});

	async function tang() {
		try {
			const res = await axios.get(
				"http://localhost:8080/api/item/%E5%94%90%E6%9C%9D/53699"
			);
			const html = res.data;
			// 返回修改后的 HTML
			return htmlToDom(html);
		} catch (err) {
			console.log("请求失败：", err.message);
			return ""; // 如果请求失败，返回空字符串
		}
	}
	function htmlToDom(html) {
		const parser = new DOMParser(); // 将 HTML 内容转化为 DOM
		const doc = parser.parseFromString(html, "text/html");
		return doc.documentElement.outerHTML;
	}
</script>

<style scoped>
	#root {
		display: flex;
		/* 使用 Flexbox 布局 */
		justify-content: space-around;
		/* 在主轴上均匀分配空间 */
		align-items: flex-start;
		/* 在交叉轴上靠上对齐 */
		height: 100vh;
		/* 设定页面高度为视口高度 */
		margin: 0;
		/* 去掉默认的 margin */
		width: 100%;
		height: 100%;
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
</style>
