<!-- Div2.vue -->
<template>
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
</template>

<script setup>
	import { ref, onMounted, nextTick } from "vue";
	import IO from "./input_output.vue";
	import MouseSelection from "@/js/mouse_selection";

	// 动态 placeholder
	const selectText1 = ref("1"); // 初始为 1

	// 页面初始化时加载内容
	onMounted(() => {
		// 每秒增加数字
		setInterval(() => {
			selectText1.value = (parseInt(selectText1.value) + 1).toString(); // 增加数字
		}, 1000); // 每 1 秒更新一次
	});
</script>

<style scoped>
	#div2 {
		width: 40%;
		height: 100%;
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
		flex-grow: 1; /* 使内部子元素可以扩展 */
	}

	.botContainer {
		flex-direction: row;
	}

	.io {
		flex: 1;
		margin: 5px;
		border: 1px solid blue;
		padding: 5px;
	}
</style>
