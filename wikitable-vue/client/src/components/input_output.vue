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
	import { ref, computed, onMounted } from "vue";

	// 接收父组件传递的 props
	const props = defineProps({
		width: {
			type: String
			// default: "10%" // 默认宽度为 10%
		},
		height: {
			type: [String, Number],
			default: "300px" // 默认最大高度为 300px
		},
		placeholder: {
			type: String,
			default: "请输入文本" // 默认 placeholder 文本
		}
	});

	// 创建响应式变量
	const inputText = ref(""); // 绑定文本框的值
	const textarea = ref(null); // 获取textarea的引用

	// 计算样式对象，支持传入的宽度和最大高度
	const textareaStyles = computed(() => ({
		width: props.width, // 根据传入的宽度设置
		maxHeight: props.height // 根据传入的最大高度设置
	}));
	console.log("2=>", props);
	// 自动调整文本框的高度
	const adjustTextareaHeight = () => {
		const textareaElement = textarea.value;
		textareaElement.style.height = "auto"; // 重置高度以重新计算

		// 获取滚动区域高度，并设置为新的高度，最大值为传入的最大高度
		const scrollHeight = textareaElement.scrollHeight;

		// 如果 height 是带单位的字符串，处理它
		let maxHeight = props.height;
		if (typeof maxHeight === "string" && maxHeight.endsWith("px")) {
			maxHeight = parseInt(maxHeight); // 仅当包含 'px' 时进行解析
		}

		textareaElement.style.height = Math.min(scrollHeight, maxHeight) + "px"; // 最大高度限制
	};

	// 在组件挂载后执行一次高度调整
	onMounted(() => {
		adjustTextareaHeight();
	});
</script>

<style scoped>
	.textarea-container {
		width: 100%;
		max-width: 500px; /* 最大宽度 */
	}

	textarea {
		width: 100%;
		min-height: 50px; /* 最小高度 */
		padding: 10px;
		font-size: 16px;
		line-height: 1.5;
		border: 1px solid #ccc;
		border-radius: 4px;
		resize: none; /* 禁用手动调整大小 */
	}
</style>
