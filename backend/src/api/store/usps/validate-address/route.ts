// Using any types to avoid ts-node subpath resolution issues
// POST /store/usps/validate-address  
export async function POST(req: any, res: any): Promise<void> {
  try {
    const { streetAddress, city, state, zipCode } = req.body || {}

    if (!streetAddress || !state || !zipCode) {
      res.status(400).json({ error: "streetAddress, state and zipCode are required" })
      return
    }

    // Strip ZIP+4 if present - USPS API only accepts 5-digit ZIP
    const zip5 = zipCode.split('-')[0]

    // Use require with absolute path from app root
    const path = require('path')
    const clientPath = path.join(process.cwd(), 'src', 'modules', 'usps-fulfillment', 'usps-client')
    const { UspsClient } = require(clientPath)
    
    const uspsClient = new UspsClient({
      clientId: process.env.USPS_CLIENT_ID,
      clientSecret: process.env.USPS_CLIENT_SECRET,
      environment: process.env.USPS_ENVIRONMENT || "testing",
    })

    console.log('=== USPS ADDRESS VALIDATION ===')
    console.log('Input:', { streetAddress, city, state, zipCode: zip5 })
    
    try {
      const addrResp = await uspsClient.validateAddress({
        streetAddress,
        city,
        state,
        zipCode: zip5,
      })

      console.log('USPS Response:', JSON.stringify(addrResp, null, 2))
      res.json({ address: addrResp })
    } catch (err: any) {
      console.log('USPS Error:', err?.message)
      res.status(500).json({ error: err?.message || "Validation failed" })
    }
  } catch (err: any) {
    req.scope.resolve("logger")?.error?.("USPS validate-address error", err)
    res.status(500).json({ error: err?.message || "Internal error" })
  }
}

// CORS preflight
export async function OPTIONS(req: any, res: any): Promise<void> {
  const origin = req.headers?.origin || "*"
  res.setHeader("Access-Control-Allow-Origin", origin)
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key")
  res.status(204).end()
}
