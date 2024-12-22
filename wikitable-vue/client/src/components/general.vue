<!-- App.vue -->
<template>
	<div id="root">
		<Div1 class="div" />
		<Div2 class="div" />
		<Div3 class="div" />
	</div>
</template>

<script setup>
	import Div1 from "./Div1.vue"; // 引入 Div1 组件
	import Div2 from "./Div2.vue"; // 引入 Div2 组件
	import Div3 from "./Div3.vue"; // 引入 Div3 组件
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
	.div {
		border: 1px solid red;
	}
</style>
