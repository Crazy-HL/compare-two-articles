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
		padding: 20px;
		font-family: sans-serif;
		font-size: 0.6vw;
	}

	::v-deep .custom-table {
		width: 100%;
		border-collapse: collapse;
		margin: 5px auto;
		background-color: #ffffff;
		border: 1px solid #0077b6;
		border-radius: 8px;
		overflow: hidden;
		font-family: "Arial", sans-serif;
		font-size: 16px;
		color: #333333;
	}

	::v-deep .custom-table th {
		background-color: #0077b6;
		font-weight: bold;
		color: #ffffff;
		text-align: left;
		padding: 12px;
		border: 1px solid #0077b6;
		font-size: 18px;
	}

	::v-deep .custom-table th,
	::v-deep .custom-table td {
		padding: 12px;
		border: 1px solid #0077b6;
		font-size: 16px;
	}

	::v-deep .custom-table tr:hover {
		background-color: #cbe8f6;
		transition: background-color 0.3s ease-in-out;
	}
</style>
