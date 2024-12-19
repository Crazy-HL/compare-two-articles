<template>
	<div id="root">
		<div class="div0" id="div1">
			<iframe
				id="frameLeft"
				src="https://en.wikipedia.org/wiki/France"
				title="页面1"></iframe>
		</div>

		<div class="div0" id="div2">
			<div class="VisContainer">
				<div class="topContainer"></div>
				<div class="botContainer"></div>
			</div>
		</div>

		<div class="div0" id="div3">
			<iframe
				id="frameRight"
				src="https://en.wikipedia.org/wiki/China"
				title="页面2"></iframe>
		</div>
	</div>
</template>

<script></script>

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
