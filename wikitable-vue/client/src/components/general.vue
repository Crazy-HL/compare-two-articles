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
		padding: 5px; /* 增加内边距 */
		background-color: #f9f9f9; /* 背景色 */
		overflow: hidden; /* 确保内容不会超出根容器 */
	}

	.div {
		flex: 1;
		margin: 0 1px; /* 增加间距 */
		padding: 0px; /* 内边距 */
		background-color: #ffffff; /* 白色背景 */
		border: 1px solid #e0e0e0; /* 更柔和的边框颜色 */
		border-radius: 12px; /* 圆角 */
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 阴影效果 */
		overflow-y: auto; /* 添加垂直滚动条 */
		max-height: calc(100vh - 40px); /* 最大高度，避免超出屏幕 */
		transition: box-shadow 0.3s ease, transform 0.3s ease; /* 悬停动画 */
	}

	.div:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); /* 悬停时阴影加深 */
		transform: translateY(-6px); /* 悬停时轻微上移 */
	}

	/* 自定义滚动条样式 */
	.div::-webkit-scrollbar {
		width: 8px; /* 滚动条宽度 */
	}

	.div::-webkit-scrollbar-track {
		background-color: #f1f1f1; /* 滚动条轨道颜色 */
		border-radius: 4px; /* 轨道圆角 */
	}

	.div::-webkit-scrollbar-thumb {
		background-color: #c1c1c1; /* 滚动条滑块颜色 */
		border-radius: 4px; /* 滑块圆角 */
	}

	.div::-webkit-scrollbar-thumb:hover {
		background-color: #a8a8a8; /* 悬停时滑块颜色 */
	}
</style>
