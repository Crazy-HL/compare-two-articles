<template>
	<div class="div0 selectContent2" id="div3">
		<div v-html="div3Content" class="showHtml"></div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted, nextTick } from "vue";
	import MouseSelection from "@/js/mouse_selection";
	import bus from "@/js/eventBus.js";

	const div3Content = ref("");

	onMounted(async () => {
		const src = "https://en.wikipedia.org/wiki/Jimmer_Fredette";
		await showHtml(src, div3Content);

		nextTick(() => {
			MouseSelection.start({
				rangeSelector: ".selectContent2",
				customId: "div3"
			});
		});

		document
			.querySelector("#div3")
			.addEventListener("mouseup", handleSelection);
	});

	onUnmounted(() => {
		document
			.querySelector("#div3")
			.removeEventListener("mouseup", handleSelection);
	});

	function handleSelection() {
		MouseSelection.selectionChangeFun(selectContent => {
			if (selectContent) {
				console.log("选中的内容来自 Div3:", selectContent);
				bus.emit("div3Event", selectContent);
			}
		}, "div3");
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
</style>
