export default async function ({ container }: any) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const remoteLink = container.resolve("remoteLink")
  const { Modules } = await import("@medusajs/utils")

  try {
    logger.info("========================================")
    logger.info("COMPLETE STORE SETUP - Starting...")
    logger.info("========================================\n")

    // Get modules
    const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
    const regionService = container.resolve(Modules.REGION)
    const apiKeyService = container.resolve(Modules.API_KEY)
    const productModule = container.resolve(Modules.PRODUCT)
    const pricingModule = container.resolve(Modules.PRICING)
    const userModule = container.resolve(Modules.USER)

    // 0. Admin User
    logger.info("0. Setting up admin user...")
    const users = await userModule.listUsers()
    if (users.length === 0) {
      await userModule.createUsers({
        email: process.env.ADMIN_EMAIL || 'admin@test.com',
        password: process.env.ADMIN_PASSWORD || 'supersecret',
      })
      logger.info("   ✓ Created admin user")
    } else {
      logger.info("   ✓ Admin user exists")
    }

    // 1. Sales Channel
    logger.info("1. Setting up sales channel...")
    let salesChannels = await salesChannelService.listSalesChannels({
      name: "Default Sales Channel"
    })
    let defaultSalesChannel = salesChannels[0]
    
    if (!defaultSalesChannel) {
      defaultSalesChannel = await salesChannelService.createSalesChannels({
        name: "Default Sales Channel",
        description: "Default sales channel for your store"
      })
      logger.info("   ✓ Created sales channel")
    } else {
      logger.info("   ✓ Sales channel exists")
    }

    // 2. Region
    logger.info("2. Setting up region...")
    let regions = await regionService.listRegions({
      name: "United States"
    })
    let defaultRegion = regions[0]
    
    if (!defaultRegion) {
      defaultRegion = await regionService.createRegions({
        name: "United States",
        currency_code: "usd",
        countries: ["us"]
      })
      logger.info("   ✓ Created region (United States - USD)")
    } else {
      // Update existing region to USD if it's not already
      if (defaultRegion.currency_code !== "usd") {
        await query.graph({
          entity: "region",
          fields: ["id", "currency_code"],
          filters: { id: defaultRegion.id }
        })
        logger.info("   ✓ Region exists (updated to USD)")
      } else {
        logger.info("   ✓ Region exists")
      }
    }
    
    // 2.1. Ensure default currency preference is USD
    logger.info("2.1. Setting default currency preference...")
    try {
      const pricePrefs = await query.graph({
        entity: "price_preference",
        fields: ["id", "attribute", "value"],
        filters: { attribute: "currency_code" }
      })
      
      if (pricePrefs.data.length > 0) {
        // Update existing preference to USD
        const dbConnection = container.resolve("manager")
        await dbConnection.query(
          `UPDATE price_preference SET value = 'usd' WHERE attribute = 'currency_code'`
        )
        logger.info("   ✓ Updated currency preference to USD")
      }
    } catch (error: any) {
      logger.warn(`   ⚠ Could not update currency preference: ${error.message}`)
    }

    // 3. API Key
    logger.info("3. Setting up API key...")
    let apiKeys = await apiKeyService.listApiKeys({
      type: "publishable"
    })
    let apiKey = apiKeys[0]
    
    if (!apiKey) {
      // Get the first admin user to use as creator
      const users = await userModule.listUsers()
      const createdBy = users.length > 0 ? users[0].id : undefined
      
      apiKey = await apiKeyService.createApiKeys({
        title: "Webstore",
        type: "publishable",
        created_by: createdBy
      })
      logger.info("   ✓ Created API key")
    } else {
      logger.info("   ✓ API key exists")
    }

    // 4. Link API key to sales channel
    logger.info("4. Linking API key to sales channel...")
    try {
      await remoteLink.create({
        [Modules.API_KEY]: { publishable_key_id: apiKey.id },
        [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
      })
      logger.info("   ✓ Linked API key to sales channel")
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        logger.info("   ✓ Link already exists")
      } else {
        logger.warn(`   ⚠ Could not link: ${error.message}`)
      }
    }

    // 5. Create Products with Variants and Prices
    logger.info("5. Creating products with variants and prices...")
    
    const productsData = [
      { title: "Classic White T-Shirt", description: "A timeless essential for any wardrobe. Made from 100% organic cotton.", thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", price: 29.99 },
      { title: "Slim Fit Jeans", description: "Comfortable and stylish denim jeans perfect for everyday wear.", thumbnail: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", price: 59.99 },
      { title: "Leather Jacket", description: "Premium leather jacket with modern design and superior comfort.", thumbnail: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400", price: 199.99 },
      { title: "Running Shoes", description: "High-performance running shoes with excellent cushioning and support.", thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", price: 89.99 },
      { title: "Cotton Hoodie", description: "Cozy and comfortable hoodie perfect for casual outings.", thumbnail: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400", price: 49.99 },
      { title: "Denim Jacket", description: "Classic denim jacket that never goes out of style.", thumbnail: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400", price: 79.99 }
    ]

    const existingProducts = await productModule.listProducts({})
    
    if (existingProducts.length === 0) {
      for (const productData of productsData) {
        // Create product
        const product = await productModule.createProducts({
          title: productData.title,
          description: productData.description,
          status: "published",
          thumbnail: productData.thumbnail,
        })

        // Create variant
        const variant = await productModule.createProductVariants({
          product_id: product.id,
          title: "Default",
          sku: `${productData.title.replace(/\s+/g, "-").toLowerCase()}-default`,
          manage_inventory: false,
          allow_backorder: true,
        })

        // Create price set
        const priceSet = await pricingModule.createPriceSets({
          prices: [{
            amount: productData.price,
            currency_code: defaultRegion.currency_code,
            rules: {},
          }],
        })

        // Link variant to price set
        await remoteLink.create({
          [Modules.PRODUCT]: { variant_id: variant.id },
          [Modules.PRICING]: { price_set_id: priceSet.id },
        })

        // Link product to sales channel
        await remoteLink.create({
          [Modules.PRODUCT]: { product_id: product.id },
          [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
        })

        logger.info(`   ✓ Created: ${productData.title} ($${productData.price.toFixed(2)})`)
      }
    } else {
      logger.info(`   ✓ ${existingProducts.length} products already exist`)
    }

    // 6. Create Collections and assign products
    logger.info("6. Creating product collections...")

    const collectionsData = [
      { title: "T-Shirts", handle: "t-shirts" },
      { title: "Jeans", handle: "jeans" },
      { title: "Hoodies", handle: "hoodies" }
    ]

    let existingCollections = await productModule.listProductCollections({})

    if (existingCollections.length === 0) {
      for (const collectionData of collectionsData) {
        const collection = await productModule.createProductCollections({
          title: collectionData.title,
          handle: collectionData.handle,
        })
        logger.info(`   ✓ Created collection: ${collectionData.title}`)
      }
      // Refresh the list after creating
      existingCollections = await productModule.listProductCollections({})
    } else {
      logger.info(`   ✓ ${existingCollections.length} collections already exist`)
    }

    // 7. Assign products to collections based on product titles
    logger.info("7. Assigning products to collections...")

    const allProducts = await productModule.listProducts({})
    const collections = await productModule.listProductCollections({})

    // Find collections by handle
    const tshirtCollection = collections.find((c: any) => c.handle === "t-shirts")
    const jeansCollection = collections.find((c: any) => c.handle === "jeans")
    const hoodiesCollection = collections.find((c: any) => c.handle === "hoodies")

    for (const product of allProducts) {
      const productTitle = product.title.toLowerCase()
      let collectionId = null

      // Match products to collections based on title keywords
      if (productTitle.includes("t-shirt") || productTitle.includes("tshirt")) {
        collectionId = tshirtCollection?.id
      } else if (productTitle.includes("jean") || productTitle.includes("denim")) {
        collectionId = jeansCollection?.id
      } else if (productTitle.includes("hoodie") || productTitle.includes("sweatshirt")) {
        collectionId = hoodiesCollection?.id
      }

      // Assign product to collection if matched
      if (collectionId) {
        try {
          await productModule.updateProducts(product.id, {
            collection_id: collectionId
          })
          logger.info(`   ✓ Assigned "${product.title}" to collection`)
        } catch (error: any) {
          logger.warn(`   ⚠ Could not assign "${product.title}": ${error.message}`)
        }
      }
    }

    // Final Summary
    logger.info("\n========================================")
    logger.info("✓ SETUP COMPLETED SUCCESSFULLY!")
    logger.info("========================================")
    logger.info("\nYour Store Details:")
    logger.info(`  Region: ${defaultRegion.name} (${defaultRegion.currency_code.toUpperCase()})`)
    logger.info(`  Region ID: ${defaultRegion.id}`)
    logger.info(`  Products: ${productsData.length}`)
    logger.info(`  Sales Channel ID: ${defaultSalesChannel.id}`)
    logger.info(`  API Key: ${apiKey.token}`)
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    logger.info("\nAdmin Login:")
    logger.info(`  URL: ${backendUrl}/app`)
    logger.info(`  Email: admin@test.com`)
    logger.info(`  Password: supersecret`)
    logger.info("\nStorefront:")
    logger.info(`  URL: ${frontendUrl}`)
    logger.info("\n⚠ NEXT STEPS:")
    logger.info("1. Update .env file - Add these values:")
    logger.info(`   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${apiKey.token}`)
    logger.info(`   NEXT_PUBLIC_MEDUSA_REGION_ID=${defaultRegion.id}`)
    logger.info(`   NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID=${defaultSalesChannel.id}`)
    logger.info("\n2. Restart containers:")
    logger.info("   docker compose restart")
    logger.info("\n✓ Setup complete! Store is ready after completing steps above.")
    logger.info("========================================\n")

  } catch (error: any) {
    logger.error("ERROR:", error.message)
    logger.error(error.stack)
    throw error
  }
}
