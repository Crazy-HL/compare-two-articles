<script>
	import history from "./components/history.vue";
	import mouse from "./components/mouse.vue";
	import general from "./components/general.vue";
	export default {
		name: "App",
		components: {
			history,
			mouse,
			general
		},
		mounted() {
			this.getData();
		},
		methods: {
			getData() {
				let self = this;
				api.get("data", { papername: "rmap1" }, data => {
					Data = data;
					store.state.loaddata = Math.random();
				});
				api.get("", {}, data => {
					console.log("@@@", data);
				});
			}
		}
	};
</script>

<template>
	<history></history>
	<!-- <mouse></mouse> -->
	<!-- <general></general> -->
</template>

<style scoped></style>
