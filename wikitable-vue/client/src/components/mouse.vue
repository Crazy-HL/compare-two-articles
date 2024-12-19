<template>
	<div>
		<h1>选择文本或元素</h1>
		<p>选择这段文本，或者图片，或者其他内容，看看控制台会打印什么！</p>
		<div class="selectable">
			<div><h1>sjdhsjhdjsh</h1></div>
			<div>
				<img src="https://via.placeholder.com/150" alt="示例图片" />
				<p>这个段落可以被选中。</p>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { onMounted } from "vue";
	import MouseSelection from "@/js/mouse_selection";

	// 使用 onMounted 生命周期钩子
	onMounted(() => {
		// 启动鼠标选择工具，限定选择区域为 class="selectable" 的元素及其子元素
		MouseSelection.start({
			rangeSelector: ".selectable" // 传递范围选择器，支持向下检索
		});
	});
</script>
