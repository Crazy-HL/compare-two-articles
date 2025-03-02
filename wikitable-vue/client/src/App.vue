<script>
	import general from "./components/general.vue";
	import Test from "./components/test.vue";
	import Vis from "./components/Vis.vue";
	import Vis2 from "./components/Vis2.vue";
	export default {
		name: "App",
		components: {
			general,
			Test,
			Vis,
			Vis2
		},
		mounted() {
			this.getData();
		},
		methods: {
			getData() {
				let self = this;
				// api.get("data", { papername: "rmap1" }, data => {
				// 	Data = data;
				// 	store.state.loaddata = Math.random();
				// });
				// api.get("", {}, data => {
				// 	console.log("@@@", data);
				// });
			}
		}
	};
</script>

<template>
	<general></general>
	<!-- <Test></Test> -->
	<!-- <Vis></Vis> -->
	<!-- <Vis2></Vis2> -->
</template>

<style scoped></style>
