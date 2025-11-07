import { ModuleProvider, Modules } from "@medusajs/utils"
import UspsProviderService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [UspsProviderService],
})
