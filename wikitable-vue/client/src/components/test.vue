<template>
	<div id="app">
		<h1>网页内容高亮工具</h1>

		<div>
			<label for="urlInput">输入网页网址：</label>
			<input v-model="url" placeholder="例如：http://example.com" />
			<button @click="loadPage">加载页面</button>
		</div>

		<div id="pageContent" v-html="content" @mouseup="handleSelection"></div>

		<div>
			<button @click="saveHighlights">保存高亮</button>
			<button @click="loadHighlights">加载高亮</button>
		</div>

		<div>
			<h2>提取的文本：</h2>
			<pre>{{ extractedText }}</pre>
		</div>
	</div>
</template>

<script>
	import axios from "axios";

	export default {
		name: "App",
		data() {
			return {
				url: "",
				content: "",
				styles: "",
				highlights: [],
				extractedText: ""
			};
		},
		methods: {
			// 加载网页内容
			async loadPage() {
				if (!this.url) {
					alert("请输入网址");
					return;
				}

				try {
					const response = await axios.get(
						`http://localhost:5001/fetch?url=${encodeURIComponent(this.url)}`
					);
					this.content = response.data.content;
					this.styles = response.data.styles;

					// 等待 Vue 渲染完成后再添加事件监听
					this.$nextTick(() => {
						const pageContent = document.getElementById("pageContent");
						pageContent.addEventListener("mouseup", this.handleSelection);
					});

					// 动态添加页面样式
					this.addStyles();
				} catch (error) {
					console.error("加载内容失败:", error);
					alert("加载内容失败");
				}
			},

			// 处理文本选中事件
			handleSelection() {
				const selection = window.getSelection();
				const selectedText = selection.toString().trim();

				if (selectedText) {
					// 高亮选中的文本
					const range = selection.getRangeAt(0);
					this.highlightText(range);

					// 提取选中的文本
					this.extractedText = selectedText;

					// 序列化选区信息
					const serializedRange = this.serializeRange(range);
					this.highlights.push(serializedRange);
				}
			},

			// 高亮选中的文本
			highlightText(range) {
				const span = document.createElement("span");
				span.className = "highlight";
				range.surroundContents(span);
			},

			// 序列化选区信息
			serializeRange(range) {
				return {
					startContainer: range.startContainer.parentElement.outerHTML,
					startOffset: range.startOffset,
					endContainer: range.endContainer.parentElement.outerHTML,
					endOffset: range.endOffset,
					text: range.toString()
				};
			},

			// 反序列化选区信息
			deserializeRange(serialized) {
				const pageContent = document.getElementById("pageContent");
				const walker = document.createTreeWalker(
					pageContent,
					NodeFilter.SHOW_TEXT
				);

				let startNode, endNode;
				while (walker.nextNode()) {
					if (
						walker.currentNode.parentElement.outerHTML ===
						serialized.startContainer
					) {
						startNode = walker.currentNode;
					}
					if (
						walker.currentNode.parentElement.outerHTML ===
						serialized.endContainer
					) {
						endNode = walker.currentNode;
					}
				}

				if (startNode && endNode) {
					const range = document.createRange();
					range.setStart(startNode, serialized.startOffset);
					range.setEnd(endNode, serialized.endOffset);
					return range;
				}
				return null;
			},

			// 保存高亮信息
			saveHighlights() {
				localStorage.setItem("highlights", JSON.stringify(this.highlights));
				alert("高亮已保存！");
			},

			// 加载高亮信息
			loadHighlights() {
				const savedHighlights = JSON.parse(
					localStorage.getItem("highlights") || "[]"
				);
				savedHighlights.forEach(serialized => {
					const range = this.deserializeRange(serialized);
					if (range) {
						this.highlightText(range);
					}
				});
				alert("高亮已加载！");
			},

			// 动态插入样式
			addStyles() {
				const styleTag = document.createElement("style");
				styleTag.innerHTML = this.styles;
				document.head.appendChild(styleTag);
			}
		}
	};
</script>

<style scoped>
	/* 可以为页面添加一些自定义样式 */
	#pageContent img {
		max-width: 100%;
		height: auto;
	}

	#pageContent p {
		line-height: 1.6;
		margin-bottom: 10px;
	}

	.highlight {
		background-color: yellow;
	}
</style>
