<template>
	<div class="view-switcher">
		<button
			@click.prevent.stop="switchView('text')"
			:class="{ active: currentView === 'text' }"
			title="文本视图">
			<font-awesome-icon :icon="['fas', 'align-left']" />
		</button>

		<button
			@click.prevent.stop="switchView('visual')"
			:class="{ active: currentView === 'visual' }"
			title="可视化视图">
			<font-awesome-icon :icon="['fas', 'chart-bar']" />
		</button>
	</div>
</template>

<script setup>
	import { ref } from "vue";

	const currentView = ref("text");
	const emit = defineEmits(["switch"]);

	const switchView = view => {
		currentView.value = view;
		emit("switch", view);
	};
</script>

<style scoped>
	.view-switcher {
		display: flex;
		justify-content: center;
		margin-bottom: 20px;
	}

	.view-switcher button {
		padding: 25px;
		margin: 0 5px;
		border: none;
		border-radius: 50%;
		background-color: #f0f0f0;
		cursor: pointer;
		transition: background-color 0.3s ease, transform 0.2s ease;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.view-switcher button:hover {
		background-color: #ddd;
		transform: scale(1.1);
	}

	.view-switcher button.active {
		background-color: #0077b6;
		color: white;
	}
</style>
