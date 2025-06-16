<template>
	<div class="dual-chains-container">
		<div
			v-for="chain in chains"
			:key="chain.country"
			class="country-chain"
			:class="chain.country">
			<div
				class="chain-header"
				@mouseenter="handleChainHeaderEnter(chain)"
				@mouseleave="handleChainHeaderLeave(chain)">
				<span class="country-flag">{{ getCountryFlag(chain.country) }}</span>
				<h3>{{ getCountryName(chain.country) }}</h3>
			</div>

			<div class="vertical-chain">
				<div
					v-for="(step, index) in chain.steps"
					:key="index"
					class="chain-step"
					@mouseenter="handleStepMouseEnter(chain.country, step)"
					@mouseleave="handleStepMouseLeave(chain.country)">
					<div class="step-content">
						<div class="step-text">{{ step.text }}</div>

						<div
							v-if="step.evidence && step.evidence.length > 0"
							class="evidence-group">
							<div
								v-for="(evidenceItem, evidenceIndex) in step.evidence"
								:key="evidenceIndex"
								class="evidence-item">
								<div class="evidence-value">{{ evidenceItem }}</div>
							</div>
						</div>
					</div>

					<div v-if="index < chain.steps.length - 1" class="step-connector">
						<div class="connector-line"></div>
						<div class="connector-arrow">↓</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	import bus from "@/js/eventBus.js";

	export default {
		props: {
			chains: {
				type: Array,
				required: true,
				default: () => []
			}
		},
		methods: {
			getCountryName(code) {
				return code === "korea" ? "韩国" : "日本";
			},
			getCountryFlag(code) {
				return code === "korea" ? "🇰🇷" : "🇯🇵";
			},
			handleStepMouseEnter(country, step) {
				if (step.used_fields && step.used_fields.length > 0) {
					bus.emit("highlight-infobox", {
						side: country === "korea" ? "left" : "right",
						fields: step.used_fields,
						highlightType: "step"
					});
				}
			},
			handleStepMouseLeave(country) {
				bus.emit("unhighlight-infobox", {
					side: country === "korea" ? "left" : "right"
				});
			},
			handleChainHeaderEnter(chain) {
				const allFields = chain.steps.reduce((acc, step) => {
					return [...acc, ...(step.used_fields || [])];
				}, []);

				if (allFields.length > 0) {
					bus.emit("highlight-infobox", {
						side: chain.country === "korea" ? "left" : "right",
						fields: allFields,
						highlightType: "chain"
					});
				}
			},
			handleChainHeaderLeave(chain) {
				bus.emit("unhighlight-infobox", {
					side: chain.country === "korea" ? "left" : "right"
				});
			}
		}
	};
</script>

<style scoped>
	.dual-chains-container {
		display: flex;
		gap: 24px;
		width: 100%;
		margin: 20px 0;
		justify-content: space-between;
	}

	.country-chain {
		flex: 1;
		min-width: 0;
		max-width: calc(50% - 12px);
		background: #f8f9fa;
		border-radius: 12px;
		padding: 16px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.chain-header {
		display: flex;
		align-items: center;
		margin-bottom: 20px;
		padding: 8px 12px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.chain-header:hover {
		background-color: rgba(0, 0, 0, 0.03);
	}

	.country-chain.korea .chain-header:hover {
		box-shadow: inset 4px 0 0 #1a73e8;
	}

	.country-chain.japan .chain-header:hover {
		box-shadow: inset 4px 0 0 #9c27b0;
	}

	.country-flag {
		font-size: 28px;
		margin-right: 12px;
	}

	.chain-header h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
	}

	.vertical-chain {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.chain-step {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: all 0.2s ease;
	}

	.chain-step:hover {
		transform: translateY(-2px);
	}

	.step-content {
		width: 100%;
		padding: 16px;
		border-radius: 8px;
		background: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.step-text {
		font-size: 14px;
		font-weight: 500;
		color: #333;
		line-height: 1.5;
		margin-bottom: 8px;
	}

	.evidence-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 12px;
	}

	.evidence-item {
		padding: 10px 12px;
		border-radius: 6px;
		font-size: 12px;
		line-height: 1.4;
	}

	.step-connector {
		width: 100%;
		height: 20px;
		position: relative;
		display: flex;
		justify-content: center;
		margin: 8px 0;
	}

	.connector-line {
		width: 2px;
		height: 100%;
		background: #ddd;
		position: absolute;
	}

	.connector-arrow {
		position: absolute;
		top: 100%;
		color: #999;
		font-size: 16px;
		line-height: 0;
		transform: translateY(-50%);
	}

	/* 韩国样式 */
	.country-chain.korea .chain-header h3 {
		color: #1a73e8;
	}

	.country-chain.korea .step-content {
		border-left: 3px solid #1a73e8;
	}

	.country-chain.korea .evidence-item {
		background: #e8f0fe;
		color: #1a73e8;
		border-left: 2px solid #1a73e8;
	}

	.country-chain.korea .chain-step:hover .step-content {
		background-color: rgba(26, 115, 232, 0.05);
		box-shadow: 0 2px 8px rgba(26, 115, 232, 0.1);
	}

	/* 日本样式 */
	.country-chain.japan .chain-header h3 {
		color: #9c27b0;
	}

	.country-chain.japan .step-content {
		border-left: 3px solid #9c27b0;
	}

	.country-chain.japan .evidence-item {
		background: #f3e5f5;
		color: #9c27b0;
		border-left: 2px solid #9c27b0;
	}

	.country-chain.japan .chain-step:hover .step-content {
		background-color: rgba(156, 39, 176, 0.05);
		box-shadow: 0 2px 8px rgba(156, 39, 176, 0.1);
	}

	@media (max-width: 768px) {
		.dual-chains-container {
			flex-direction: column;
			gap: 20px;
		}

		.country-chain {
			max-width: 100%;
		}

		.step-content {
			padding: 12px 14px;
		}

		.step-text {
			font-size: 13px;
		}

		.evidence-item {
			padding: 8px 10px;
			font-size: 11px;
		}

		.connector-arrow {
			font-size: 14px;
		}
	}
</style>
