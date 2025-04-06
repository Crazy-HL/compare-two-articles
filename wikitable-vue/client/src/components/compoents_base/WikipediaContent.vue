<template>
	<div class="wikipedia-content" v-html="content" @mouseup="onMouseUp"></div>
</template>

<script setup>
	const props = defineProps({
		content: {
			type: String,
			required: true
		}
	});

	const emit = defineEmits(["select"]);

	const onMouseUp = () => {
		const selection = window.getSelection();
		if (!selection.rangeCount) return;

		const range = selection.getRangeAt(0);
		const selectedHtml = range.cloneContents();

		// 创建临时容器
		const tempDiv = document.createElement("div");
		tempDiv.appendChild(selectedHtml);

		// 判断选中的内容是否包含表格
		const table = tempDiv.querySelector("table");
		if (table) {
			table.classList.add("custom-table");
			emit("select", tempDiv.innerHTML);
		} else {
			const text = selection.toString().trim();
			if (text) {
				emit("select", text);
			}
		}
	};
</script>

<style scoped>
	.wikipedia-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 10px;
		font-family: sans-serif;
		font-size: 0.6vw;
	}
</style>
