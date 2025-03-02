<template>
	<div class="textarea-container">
		<textarea
			v-model="inputText"
			ref="textarea"
			:placeholder="placeholder"
			@input="adjustTextareaHeight"
			:style="textareaStyles"></textarea>
	</div>
</template>

<script setup>
	import { ref, computed, onMounted, nextTick } from "vue";

	// 接收父组件传递的 props
	const props = defineProps({
		width: {
			type: String,
			default: "100%" // 默认宽度为 100%
		},
		height: {
			type: [String, Number],
			default: "150px" // 默认高度为 150px
		},
		placeholder: {
			type: String,
			default: "请输入文本" // 默认 placeholder 文本
		}
	});

	// 创建响应式变量
	const inputText = ref(""); // 绑定文本框的值
	const textarea = ref(null); // 获取 textarea 的引用

	// 计算样式对象，支持传入的宽度和高度
	const textareaStyles = computed(() => ({
		width: props.width, // 根据传入的宽度设置
		height: props.height // 根据传入的高度设置
	}));

	// 自动调整文本框的高度
	const adjustTextareaHeight = () => {
		const textareaElement = textarea.value;

		// 重置 textarea 的高度为 auto 以重新计算高度
		textareaElement.style.height = "auto";

		// 获取滚动区域的高度（实际内容的高度）
		const scrollHeight = textareaElement.scrollHeight;

		// 将最大高度作为限制
		let maxHeight = props.height;
		if (typeof maxHeight === "string" && maxHeight.endsWith("px")) {
			maxHeight = parseInt(maxHeight); // 仅当包含 'px' 时进行解析
		}

		// 设置新的高度，确保不超过最大高度，并且至少为传入的最小高度
		textareaElement.style.height =
			Math.min(Math.max(scrollHeight, parseInt(props.height)), maxHeight) +
			"px";
	};

	// 在组件挂载后执行一次高度调整
	onMounted(() => {
		nextTick(() => {
			adjustTextareaHeight();
		});
	});
</script>

<style scoped>
	.textarea-container {
		width: 100%;
	}

	textarea {
		width: 100%;
		padding: 10px;
		font-size: 16px;
		line-height: 1.5;
		border: 1px solid #ccc;
		border-radius: 8px;
		resize: none; /* 禁用手动调整大小 */
		background-color: #fff;
	}
</style>
