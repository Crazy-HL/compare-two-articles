<template>
	<div class="chat-container">
		<!-- 历史对话记录 -->
		<div class="chat-history">
			<div
				v-for="(message, index) in chatHistory"
				:key="index"
				:class="['message', message.role]">
				<div class="message-content">
					<strong>{{ message.role === "user" ? "用户" : "GPT" }}:</strong>
					<p>{{ message.content }}</p>
				</div>
			</div>
		</div>

		<!-- 输入框和操作按钮 -->
		<div class="input-container">
			<textarea
				v-model="userQuestion"
				rows="4"
				placeholder="请输入你想问的问题..."></textarea>
			<div class="button-container">
				<button @click="askQuestion">发送</button>
				<button @click="compareTexts">对比文章</button>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted } from "vue";
	import bus from "@/js/eventBus.js";

	const userQuestion = ref(""); // 用户输入的问题
	const chatHistory = ref([]); // 历史对话记录
	const selectText2 = ref(""); // 左侧选中文本
	const selectText3 = ref(""); // 右侧选中文本

	let offDiv1, offDiv3;

	onMounted(() => {
		offDiv1 = bus.on("div1Event", data => handleSelection(data, "div1"));
		offDiv3 = bus.on("div3Event", data => handleSelection(data, "div3"));
	});

	onUnmounted(() => {
		offDiv1();
		offDiv3();
	});

	// 处理选中文本
	function handleSelection(data, source) {
		const plainText = getPlainTextFromSelection(data.content);
		if (source === "div1") {
			selectText2.value = plainText;
		} else if (source === "div3") {
			selectText3.value = plainText;
		}
	}

	// 从 HTML 内容中提取纯文本
	function getPlainTextFromSelection(htmlContent) {
		const container = document.createElement("div");
		container.innerHTML = htmlContent;
		return container.innerText || container.textContent || "";
	}

	// 向 GPT 提问
	async function askQuestion() {
		if (!userQuestion.value) {
			alert("请输入问题！");
			return;
		}

		// 将用户的问题添加到历史记录
		chatHistory.value.push({ role: "user", content: userQuestion.value });

		try {
			const response = await api.post(
				"gpt_ask",
				{ question: userQuestion.value },
				data => {
					if (data) {
						// 将 GPT 的回答添加到历史记录
						chatHistory.value.push({ role: "assistant", content: data.answer });
					} else {
						console.error("提问失败:", data.error);
					}
				}
			);
		} catch (error) {
			console.error("请求失败:", error);
		}

		// 清空输入框
		userQuestion.value = "";
	}

	// 对比文章
	async function compareTexts() {
		if (!selectText2.value || !selectText3.value) {
			alert("请先选择两段文本！");
			return;
		}

		try {
			api.post(
				"gpt_compare",
				{ text1: selectText2.value, text2: selectText3.value },
				data => {
					if (data) {
						// 将对比结果添加到历史记录
						chatHistory.value.push({ role: "assistant", content: data.result });
					} else {
						console.error("对比失败:", data.error);
					}
				}
			);
		} catch (error) {
			console.error("请求失败:", error);
		}
	}
</script>

<style scoped>
	/* 容器样式 */
	.chat-container {
		width: 700px; /* 设置初始宽度 */
		display: flex;
		flex-direction: column;
		height: 100%;
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		background-color: #f9f9f9;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	/* 历史对话记录 */
	.chat-history {
		flex: 1;
		overflow-y: auto;
		margin-bottom: 20px;
		padding: 10px;
		background-color: #fff;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	/* 消息样式 */
	.message {
		margin-bottom: 15px;
	}

	.message-content {
		padding: 10px;
		border-radius: 8px;
		background-color: #e0e0e0;
	}

	.message.user .message-content {
		background-color: #d1e7dd;
		text-align: right;
	}

	.message.assistant .message-content {
		background-color: #f8f9fa;
		text-align: left;
	}

	/* 输入框和按钮容器 */
	.input-container {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	textarea {
		width: 100%;
		resize: none;
		padding: 10px;
		font-size: 16px;
		border: 1px solid #ccc;
		border-radius: 8px;
	}

	.button-container {
		display: flex;
		gap: 10px;
	}

	button {
		padding: 10px 20px;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		flex: 1;
	}

	button:hover {
		background-color: #45a049;
	}
</style>
