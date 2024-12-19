<template>
	<div id="root">
		<div class="div0" id="div1">
			<!-- 使用代理服务器转发请求 -->
			<iframe
				id="frameLeft"
				src="http://localhost:3000/proxy/item/%E5%94%90%E6%9C%9D/53699"
				title="页面1"></iframe>
			<div id="overlay" class="overlay" @mousedown="startSelection"></div>
		</div>

		<div class="div0" id="div2">
			<div class="VisContainer">
				<div class="topContainer"></div>
				<div class="botContainer"></div>
			</div>
		</div>

		<div class="div0" id="div3">
			<!-- 使用代理服务器转发请求 -->
			<iframe
				id="frameRight"
				src="http://localhost:3000/proxy/item/%E5%94%90%E6%9C%9D/53699"
				title="页面2"></iframe>
			<div id="overlay" class="overlay" @mousedown="startSelection"></div>
		</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {
				selectionStartX: 0,
				selectionStartY: 0,
				isSelecting: false,
				overlayStyle: {
					display: "none",
					left: "0px",
					top: "0px",
					width: "0px",
					height: "0px"
				}
			};
		},
		methods: {
			startSelection(event) {
				const iframe = document.getElementById(
					event.target.id === "frameLeft" ? "frameLeft" : "frameRight"
				);
				const iframeRect = iframe.getBoundingClientRect();

				this.selectionStartX = event.clientX - iframeRect.left;
				this.selectionStartY = event.clientY - iframeRect.top;
				this.isSelecting = true;

				this.overlayStyle.display = "block";
				this.overlayStyle.left = `${this.selectionStartX}px`;
				this.overlayStyle.top = `${this.selectionStartY}px`;
			},

			updateSelection(event) {
				if (!this.isSelecting) return;
				const iframe = document.getElementById(
					event.target.id === "frameLeft" ? "frameLeft" : "frameRight"
				);
				const iframeRect = iframe.getBoundingClientRect();

				const currentX = event.clientX - iframeRect.left;
				const currentY = event.clientY - iframeRect.top;

				const width = currentX - this.selectionStartX;
				const height = currentY - this.selectionStartY;

				this.overlayStyle.width = `${Math.abs(width)}px`;
				this.overlayStyle.height = `${Math.abs(height)}px`;
				if (width < 0) this.overlayStyle.left = `${currentX}px`;
				if (height < 0) this.overlayStyle.top = `${currentY}px`;
			},

			endSelection() {
				this.isSelecting = false;
				// 在此处可以实现从 iframe 中提取选中文本的功能
				this.overlayStyle.display = "none";
				alert("文本选择结束");
			}
		},
		mounted() {
			// 注册鼠标移动和松开事件
			document.addEventListener("mousemove", this.updateSelection);
			document.addEventListener("mouseup", this.endSelection);
		},
		beforeDestroy() {
			document.removeEventListener("mousemove", this.updateSelection);
			document.removeEventListener("mouseup", this.endSelection);
		}
	};
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

	.overlay {
		position: absolute;
		background-color: rgba(0, 0, 255, 0.2);
		pointer-events: none;
		z-index: 10;
	}
</style>
