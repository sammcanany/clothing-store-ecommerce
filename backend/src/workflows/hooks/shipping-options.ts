// @ts-nocheck
import { 
  listShippingOptionsForCartWorkflow,
  listShippingOptionsForCartWithPricingWorkflow 
} from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/workflows-sdk"

// Add enabled_in_store context to shipping options retrieval
// This ensures shipping options with enabled_in_store rules are matched correctly
listShippingOptionsForCartWorkflow.hooks.setShippingOptionsContext(
  async ({ cart, fulfillmentSetIds, additional_data }, { container }) => {
    const logger = container.resolve("logger")
    const query = container.resolve("query")
    
    logger.info("=== WORKFLOW HOOK CALLED ===")
    logger.info(`Cart: ${JSON.stringify(cart)}`)
    logger.info(`Fulfillment Set IDs: ${JSON.stringify(fulfillmentSetIds)}`)
    
    // Debug: Check what stock locations are linked to this sales channel
    try {
      const { data: salesChannels } = await query.graph({
        entity: "sales_channel",
        filters: { id: cart.sales_channel_id },
        fields: ["id", "name", "stock_locations.id", "stock_locations.name"],
      })
      logger.info(`Sales Channel Stock Locations: ${JSON.stringify(salesChannels[0]?.stock_locations || [])}`)
      
      // Also check fulfillment sets for those stock locations
      if (salesChannels[0]?.stock_locations?.length > 0) {
        const stockLocationIds = salesChannels[0].stock_locations.map(loc => loc.id)
        const { data: stockLocations } = await query.graph({
          entity: "stock_location",
          filters: { id: stockLocationIds },
          fields: ["id", "name", "fulfillment_sets.id", "fulfillment_sets.name"],
        })
        logger.info(`Stock Locations with Fulfillment Sets: ${JSON.stringify(stockLocations)}`)
      }
    } catch (error) {
      logger.error(`Error checking sales channel links: ${error.message}`)
    }
    
    // Return context - must include enabled_in_store
    const context = {
      enabled_in_store: "true",
      is_return: "false",
    }
    
    logger.info(`Returning context: ${JSON.stringify(context)}`)
    return new StepResponse(context)
  }
)

// Also add to the pricing workflow to ensure consistency
listShippingOptionsForCartWithPricingWorkflow.hooks.setShippingOptionsContext(
  async ({ cart, fulfillmentSetIds, additional_data }, { container }) => {
    return new StepResponse({
      enabled_in_store: "true",
      is_return: "false",
    })
  }
)
