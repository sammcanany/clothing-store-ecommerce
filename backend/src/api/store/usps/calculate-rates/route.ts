// Using any types to avoid ts-node subpath resolution issues
// POST /store/usps/calculate-rates
export async function POST(req: any, res: any): Promise<void> {
  try {
    const { destinationZip, weight = 1, dimensions } = req.body || {}
    
    // Debug: log what we received
    console.log('=== USPS CALCULATE RATES DEBUG ===')
    console.log('destinationZip:', destinationZip)
    console.log('weight:', weight, 'type:', typeof weight)
    console.log('dimensions:', JSON.stringify(dimensions))
    console.log('===================================')

    if (!destinationZip) {
      res.status(400).json({ error: "destinationZip is required" })
      return
    }

    // Use require with absolute path from app root
    const path = require('path')
    const clientPath = path.join(process.cwd(), 'src', 'modules', 'usps-fulfillment', 'usps-client')
    const { UspsClient } = require(clientPath)
    
    const uspsClient = new UspsClient({
      clientId: process.env.USPS_CLIENT_ID,
      clientSecret: process.env.USPS_CLIENT_SECRET,
      environment: process.env.USPS_ENVIRONMENT || "testing",
    })
    
    const originZip = process.env.WAREHOUSE_ZIP || "66217"
    
    // Log incoming request
    req.scope.resolve("logger")?.info?.("USPS calculate-rates request:", { 
      destinationZip, 
      weight, 
      dimensions,
      dimensionsType: typeof dimensions?.length
    })
    
    // Ensure dimensions are numbers (they might come as strings from DB)
    const packageDimensions = dimensions ? {
      length: Number(dimensions.length) || 10,
      width: Number(dimensions.width) || 8,
      height: Number(dimensions.height) || 2
    } : { length: 10, width: 8, height: 2 }
    
    const packageWeight = Math.max(Number(weight) || 0.5, 0.1)
    
    req.scope.resolve("logger")?.info?.("Sending to USPS:", { 
      packageDimensions,
      packageWeight,
      originZip,
      destinationZip
    })

    const mailClasses = [
      { id: "PRIORITY_MAIL", name: "USPS Priority Mail" },
      { id: "PRIORITY_MAIL_EXPRESS", name: "USPS Priority Mail Express" },
      { id: "USPS_GROUND_ADVANTAGE", name: "USPS Ground Advantage" },
      { id: "FIRST-CLASS_PACKAGE_SERVICE", name: "USPS First-Class Package Service" }
    ]

    const rates: any[] = []

    for (const mailClass of mailClasses) {
      try {
        const rateResponse = await uspsClient.calculateRates({
          originZIPCode: originZip,
          destinationZIPCode: destinationZip,
          weight: packageWeight,
          length: packageDimensions.length,
          width: packageDimensions.width,
          height: packageDimensions.height,
          mailClass: mailClass.id,
          priceType: "RETAIL"
        })

        if (rateResponse?.rateOptions?.length) {
          const opt = rateResponse.rateOptions[0]
          rates.push({
            id: mailClass.id,
            name: mailClass.name,
            price: opt.totalBasePrice,
            priceInCents: Math.round(opt.totalBasePrice * 100),
            deliveryDays: opt.estimatedDelivery || "2-5 business days"
          })
        }
      } catch (err: any) {
        // continue
        req.scope.resolve("logger")?.warn?.(`USPS rate error for ${mailClass.id}: ${err?.message || err}`)
      }
    }

    if (!rates.length) {
      res.status(500).json({ error: "Unable to calculate shipping rates" })
      return
    }

    res.json({ originZip, destinationZip, rates: rates.sort((a, b) => a.price - b.price) })
  } catch (err: any) {
    req.scope.resolve("logger")?.error?.("USPS calculate-rates error", err)
    res.status(500).json({ error: err?.message || "Internal error" })
  }
}

    // Handle CORS preflight
    export async function OPTIONS(req: any, res: any): Promise<void> {
      const origin = req.headers?.origin || "*"
      res.setHeader("Access-Control-Allow-Origin", origin)
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key")
      res.status(204).end()
    }
