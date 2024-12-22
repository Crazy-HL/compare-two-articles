<template>
	<div id="root">
		<!-- div1: 确保 div1 有明确的定位和隔离 -->
		<div class="div0 selectContent1" id="div1">
			<div v-html="div1Content" class="showHtml"></div>
		</div>

		<!-- div2: 使用 flex 布局来撑开 -->
		<div class="div0" id="div2">
			<div class="VisContainer">
				<div class="topContainer container">
					<IO width="800px" height="250px" :placeholder="selectText1"></IO>
				</div>
				<div class="botContainer container">
					<div class="io">
						<IO width="400px" height="250px" :placeholder="selectText1"></IO>
					</div>
					<div class="io">
						<IO width="400px" height="250px" :placeholder="selectText1"></IO>
					</div>
				</div>
			</div>
		</div>

		<!-- div3: 同样要有隔离，避免影响 div2 -->
		<div class="div0 selectContent2" id="div3" ref="div3Ref">
			<div v-html="div3Content" class="showHtml"></div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, nextTick } from "vue";
	import IO from "./input_output.vue";
	import MouseSelection from "@/js/mouse_selection";

	// 用于存储 HTML 内容
	const div1Content = ref("");
	const div3Content = ref("");
	const div3Ref = ref(null);

	// 动态 placeholder
	const selectText1 = ref("1"); // 初始为 1

	// 页面初始化时加载内容
	onMounted(async () => {
		const src1 = "https://baike.baidu.com/item/%E5%94%90%E6%9C%9D/53699";
		const src2 = "https://zh.wikipedia.org/wiki/%E5%94%90%E6%9C%9D";
		// 获取并加载内容
		await showHtml(src1, div3Content);
		// await showHtml(src2, div1Content);

		// 使用 nextTick 确保 v-html 渲染完成后再启动 MouseSelection
		nextTick(() => {
			MouseSelection.start({
				rangeSelector: ".selectContent1" // 传递范围选择器，支持向下检索
			});
			MouseSelection.start({
				rangeSelector: ".selectContent2" // 传递范围选择器，支持向下检索
			});
		});

		// 每秒增加数字
		setInterval(() => {
			selectText1.value = (parseInt(selectText1.value) + 1).toString(); // 增加数字
		}, 1000); // 每 1 秒更新一次
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
	#root {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		height: 100vh;
		width: 100%;
		overflow: hidden; /* 确保内容不会超出根容器 */
	}

	.div0 {
		position: relative;
		height: 100%;
		border: 2px solid red;
	}

	#div1,
	#div3 {
		width: 30%;
		max-width: 100%; /* 限制宽度不超过父容器的宽度 */
		max-height: 100%; /* 限制高度不超过父容器的高度 */
		overflow: auto; /* 如果内容超出，添加滚动条 */
	}
	/* div2 修改: 使用 flex-grow 来自动撑开 */
	#div2 {
		width: 40%;
		flex-grow: 1; /* 使 div2 自动撑开占据剩余空间 */
		display: flex;
		flex-direction: column; /* 保证内部子元素（如 .VisContainer）能自动排布 */
	}

	.VisContainer {
		display: flex;
		flex-direction: column;
		margin: 10px 10px;
		border: 2px solid rgb(4, 44, 68);
		flex-grow: 1; /* 确保 VisContainer 会撑开 */
	}

	.container {
		display: flex;
		border: 1px solid black;
		margin: 10px 10px;
		flex-grow: 1; /* 确保 VisContainer 会撑开 */
	}

	.botContainer {
		flex-direction: row;
	}

	.io {
		flex: 1;
		margin: 5px, 10px;
		border: 1px solid blue;
		margin: 0 20px;
		padding: 5px 5px;
	}

	/* 其它 */
	.showHtml {
		width: 100%;
		height: 100%; /* 确保 iframe 的内容充满容器 */
		border: 1px solid #ccc;
		overflow: auto; /* 允许滚动 */
	}
</style>
