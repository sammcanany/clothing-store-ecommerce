// Using any types to avoid ts-node subpath resolution issues
// POST /store/usps/calculate-rates
export async function POST(req: any, res: any): Promise<void> {
  try {
    const { destinationZip, weight = 1, dimensions } = req.body || {}

    // Input validation - destinationZip required
    if (!destinationZip) {
      res.status(400).json({ error: "destinationZip is required" })
      return
    }

    // Validate ZIP code format (5 digits or 5+4 format)
    const zipRegex = /^\d{5}(-\d{4})?$/
    if (!zipRegex.test(destinationZip)) {
      res.status(400).json({ error: "Invalid ZIP code format. Must be 5 digits or ZIP+4 format (e.g., 12345 or 12345-6789)" })
      return
    }

    // Validate weight range (USPS max is 70 lbs for most services)
    const weightNum = Number(weight)
    if (isNaN(weightNum) || weightNum < 0.1 || weightNum > 70) {
      res.status(400).json({ error: "Weight must be between 0.1 and 70 pounds" })
      return
    }

    // Validate dimensions if provided
    if (dimensions) {
      const length = Number(dimensions.length)
      const width = Number(dimensions.width)
      const height = Number(dimensions.height)

      if (isNaN(length) || isNaN(width) || isNaN(height)) {
        res.status(400).json({ error: "Dimensions must be valid numbers" })
        return
      }

      if (length < 1 || length > 108 || width < 1 || width > 108 || height < 1 || height > 108) {
        res.status(400).json({ error: "Each dimension must be between 1 and 108 inches" })
        return
      }

      // Check combined length and girth (USPS max is 130 inches for most services)
      const girth = 2 * (width + height)
      const combinedLengthGirth = length + girth
      if (combinedLengthGirth > 130) {
        res.status(400).json({ error: "Combined length and girth cannot exceed 130 inches" })
        return
      }
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
    
    // Ensure dimensions are numbers (they might come as strings from DB)
    const packageDimensions = dimensions ? {
      length: Number(dimensions.length) || 10,
      width: Number(dimensions.width) || 8,
      height: Number(dimensions.height) || 2
    } : { length: 10, width: 8, height: 2 }
    
    const packageWeight = weightNum

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
    res.status(500).json({ error: "Unable to calculate shipping rates at this time" })
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
