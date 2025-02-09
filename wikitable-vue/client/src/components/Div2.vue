<template>
	<div class="div0" id="div2">
		<div class="VisContainer">
			<div class="topContainer container">
				<IO width="542px" height="310px" :placeholder="selectText1"></IO>
			</div>
			<div class="botContainer container">
				<div class="io">
					<IO width="250px" height="290px" :placeholder="selectText2"></IO>
				</div>
				<div class="io">
					<IO width="240px" height="290px" :placeholder="selectText3"></IO>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import { ref, onMounted, onUnmounted } from "vue";
	import IO from "./input_output.vue";
	import bus from "@/js/eventBus.js";

	const selectText1 = ref("");
	const selectText2 = ref("");
	const selectText3 = ref("");

	let offDiv1, offDiv3;

	onMounted(() => {
		// 订阅 div1 和 div3 的事件
		offDiv1 = bus.on("div1Event", data => handleSelection(data, "div1"));
		offDiv3 = bus.on("div3Event", data => handleSelection(data, "div3"));
	});

	onUnmounted(() => {
		// 取消订阅，避免内存泄漏
		offDiv1();
		offDiv3();
	});

	function handleSelection(data, source) {
		const plainText = getPlainTextFromSelection(data.content);
		if (source === "div1") {
			selectText2.value = plainText;
		} else if (source === "div3") {
			selectText3.value = plainText;
		}
	}

	// 仅获取选中的纯文本内容，去除 HTML 标签
	function getPlainTextFromSelection(htmlContent) {
		const container = document.createElement("div");
		container.innerHTML = htmlContent;
		return container.innerText || container.textContent || "";
	}
</script>

<style scoped>
	#div2 {
		width: 40%;
		height: 100%;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	.VisContainer {
		display: flex;
		flex-direction: column;
		margin: 10px;
		border: 2px solid rgb(4, 44, 68);
		flex-grow: 1;
	}

	.container {
		display: flex;
		border: 1px solid black;
		margin: 10px;
		flex-grow: 1;
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
