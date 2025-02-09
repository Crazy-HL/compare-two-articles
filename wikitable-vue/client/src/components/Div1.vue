<template>
	<div class="div0 selectContent1" id="div1">
		<div v-html="div1Content" class="showHtml"></div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted, nextTick } from "vue";
	import MouseSelection from "@/js/mouse_selection";
	import bus from "@/js/eventBus.js";

	const div1Content = ref("");

	onMounted(async () => {
		const src = "https://baike.baidu.com/item/%E5%94%90%E6%9C%9D/53699";
		await showHtml(src, div1Content);

		nextTick(() => {
			MouseSelection.start({
				rangeSelector: ".selectContent1",
				customId: "div1"
			});
		});

		// 只绑定 div1 的 mouseup 事件
		document
			.querySelector("#div1")
			.addEventListener("mouseup", handleSelection);
	});

	onUnmounted(() => {
		// 解绑事件，防止内存泄漏
		document
			.querySelector("#div1")
			.removeEventListener("mouseup", handleSelection);
	});

	function handleSelection() {
		MouseSelection.selectionChangeFun(selectContent => {
			if (selectContent) {
				console.log("选中的内容来自 Div1:", selectContent);
				bus.emit("div1Event", selectContent);
			}
		}, "div1");
	}

	async function showHtml(src, area) {
		try {
			api.get("html", { url: src }, data => {
				area.value = htmlToDom(data);
			});
		} catch (err) {
			console.log("请求失败：", err.message);
			area.value = "";
		}
	}

	function htmlToDom(html) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		return doc.documentElement.outerHTML;
	}
</script>

<style scoped>
	#div1 {
		width: 30%;
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
</style>
