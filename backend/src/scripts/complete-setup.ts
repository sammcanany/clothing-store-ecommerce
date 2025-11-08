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
    const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
    const storeModule = container.resolve(Modules.STORE)

    // -1. Store Setup (currencies)
    logger.info("-1. Setting up store with currencies...")
    const stores = await storeModule.listStores()
    let store = stores[0]
    
    if (!store) {
      // Create store if it doesn't exist
      store = await storeModule.createStores({
        name: "Main Store",
        supported_currencies: [
          {
            currency_code: "usd",
            is_default: true
          }
        ]
      })
      logger.info("   ✓ Created store with USD currency")
    } else {
      // Check if USD is already configured
      const hasUSD = store.supported_currencies?.some((c: any) => c.currency_code === 'usd')
      
      if (!hasUSD) {
        // Update store to add USD
        store = await storeModule.updateStores(store.id, {
          supported_currencies: [
            ...(store.supported_currencies || []),
            {
              currency_code: "usd",
              is_default: true
            }
          ]
        })
        logger.info("   ✓ Added USD currency to store")
      } else {
        logger.info("   ✓ Store already has USD currency")
      }
    }

    // 0. Admin User
    logger.info("0. Setting up admin user...")
    const authModule = container.resolve(Modules.AUTH)
    const { createUserAccountWorkflow } = await import("@medusajs/core-flows")
    
    const users = await userModule.listUsers()
    
    if (users.length === 0) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com'
      const adminPassword = process.env.ADMIN_PASSWORD || 'supersecret'
      
      // Register using emailpass provider to properly hash password
      const { success, authIdentity, error } = await authModule.register("emailpass", {
        body: {
          email: adminEmail,
          password: adminPassword,
        }
      } as any)
      
      if (!success || !authIdentity) {
        logger.error(`   ✗ Failed to create auth identity: ${error}`)
        throw new Error(`Auth identity creation failed: ${error}`)
      }
      
      // Create user and link to auth identity using workflow
      await createUserAccountWorkflow(container).run({
        input: {
          authIdentityId: authIdentity.id,
          userData: {
            email: adminEmail,
            first_name: "Admin",
            last_name: "User",
          }
        }
      })
      
      logger.info("   ✓ Created admin user with auth identity")
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
    
    // 2.1. Set default region on store
    logger.info("2.1. Setting default region on store...")
    try {
      await storeModule.updateStores(store.id, {
        default_region_id: defaultRegion.id
      })
      logger.info("   ✓ Set default region to United States")
    } catch (error: any) {
      logger.warn(`   ⚠ Could not set default region: ${error.message}`)
    }

    // 2.2. Create USPS Shipping Option
    logger.info("2.2. Setting up USPS shipping option...")
    try {
      // First, we need to find or create a stock location
      const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)
      let locations = await stockLocationModule.listStockLocations({ name: "Main Warehouse" })
      let location = locations[0]
      
      if (!location) {
        // Get warehouse address from environment
        const warehouseAddress = process.env.WAREHOUSE_ADDRESS || "123 Main St"
        const warehouseCity = process.env.WAREHOUSE_CITY || "Overland Park"
        const warehouseState = process.env.WAREHOUSE_STATE || "KS"
        const warehouseZip = process.env.WAREHOUSE_ZIP || "66217"
        const warehouseCountry = process.env.WAREHOUSE_COUNTRY || "US"
        
        location = await stockLocationModule.createStockLocations({
          name: "Main Warehouse",
          address: {
            address_1: warehouseAddress,
            city: warehouseCity,
            province: warehouseState,
            postal_code: warehouseZip,
            country_code: warehouseCountry.toLowerCase()
          }
        })
        logger.info(`   ✓ Created stock location (${warehouseCity}, ${warehouseState} ${warehouseZip})`)
      } else {
        logger.info("   ✓ Stock location exists")
      }

      // Set as default stock location on store
      try {
        await storeModule.updateStores(store.id, {
          default_location_id: location.id
        })
        logger.info("   ✓ Set default stock location")
      } catch (error: any) {
        logger.warn(`   ⚠ Could not set default stock location: ${error.message}`)
      }

      // Link sales channel to stock location (required for fulfillment set discovery)
      const remoteLink = container.resolve("remoteLink")
      try {
        await remoteLink.create({
          [Modules.SALES_CHANNEL]: {
            sales_channel_id: defaultSalesChannel.id
          },
          [Modules.STOCK_LOCATION]: {
            stock_location_id: location.id
          }
        })
        logger.info("   ✓ Linked sales channel to stock location")
      } catch (error) {
        // Link might already exist
        logger.info("   ✓ Sales channel already linked to stock location")
      }

      // Link USPS provider to stock location
      const providers = await fulfillmentModule.listFulfillmentProviders()
      const uspsProvider = providers.find((p: any) => p.id.includes('usps'))
      
      if (uspsProvider && location) {
        try {
          await remoteLink.create({
            [Modules.STOCK_LOCATION]: {
              stock_location_id: location.id,
            },
            [Modules.FULFILLMENT]: {
              fulfillment_provider_id: uspsProvider.id,
            },
          })
          logger.info("   ✓ Linked USPS provider to stock location")
        } catch (error: any) {
          // Link might already exist
          if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            logger.info("   ✓ USPS provider already linked to stock location")
          } else {
            logger.warn(`   ⚠ Could not link USPS provider: ${error.message}`)
          }
        }
      }

      // Create shipping option type if it doesn't exist
      const existingTypes = await fulfillmentModule.listShippingOptionTypes()
      let shippingOptionType = existingTypes.find((t: any) => t.code === 'standard-shipping')
      
      if (!shippingOptionType) {
        shippingOptionType = await fulfillmentModule.createShippingOptionTypes({
          label: "Standard Shipping",
          code: "standard-shipping",
          description: "Standard shipping options for orders"
        })
        logger.info("   ✓ Created shipping option type")
      } else {
        logger.info("   ✓ Shipping option type exists")
      }

      // Get or create fulfillment set for the location
      const fulfillmentSets = await fulfillmentModule.listFulfillmentSets()
      let fulfillmentSet = fulfillmentSets[0]
      
      if (!fulfillmentSet) {
        fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
          name: "Default Fulfillment Set",
          type: "shipping"
        })
        logger.info("   ✓ Created fulfillment set")
        
        // Link fulfillment set to stock location
        if (location) {
          try {
            await remoteLink.create({
              [Modules.STOCK_LOCATION]: {
                stock_location_id: location.id,
              },
              [Modules.FULFILLMENT]: {
                fulfillment_set_id: fulfillmentSet.id,
              },
            })
            logger.info("   ✓ Linked fulfillment set to stock location")
          } catch (error: any) {
            if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
              logger.info("   ✓ Fulfillment set already linked")
            } else {
              logger.warn(`   ⚠ Could not link fulfillment set: ${error.message}`)
            }
          }
        }
      } else {
        logger.info("   ✓ Fulfillment set exists")
        
        // Ensure fulfillment set is linked to stock location
        if (location) {
          try {
            await remoteLink.create({
              [Modules.STOCK_LOCATION]: {
                stock_location_id: location.id,
              },
              [Modules.FULFILLMENT]: {
                fulfillment_set_id: fulfillmentSet.id,
              },
            })
            logger.info("   ✓ Linked fulfillment set to stock location")
          } catch (error: any) {
            if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
              logger.info("   ✓ Fulfillment set already linked to stock location")
            } else {
              logger.warn(`   ⚠ Could not link fulfillment set: ${error.message}`)
            }
          }
        }
      }

      // Create service zone if it doesn't exist
      const serviceZones = await fulfillmentModule.listServiceZones()
      let serviceZone = serviceZones.find((sz: any) => sz.name === 'United States')
      
      if (!serviceZone) {
        serviceZone = await fulfillmentModule.createServiceZones({
          name: "United States",
          fulfillment_set_id: fulfillmentSet.id,
          geo_zones: [{
            type: "country",
            country_code: "us"
          }]
        })
        logger.info("   ✓ Created service zone (United States)")
      } else {
        logger.info("   ✓ Service zone exists")
      }

      // Link service zone to region
      try {
        await remoteLink.create({
          [Modules.FULFILLMENT]: {
            service_zone_id: serviceZone.id,
          },
          [Modules.REGION]: {
            region_id: defaultRegion.id,
          },
        })
        logger.info("   ✓ Linked service zone to region")
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          logger.info("   ✓ Service zone already linked to region")
        } else {
          logger.warn(`   ⚠ Could not link service zone to region: ${error.message}`)
        }
      }

      // Define all USPS shipping methods
      const shippingMethods = [
        {
          name: "USPS Ground Advantage",
          mailClass: "USPS_GROUND_ADVANTAGE",
          description: "Affordable ground shipping (2-5 business days)"
        },
        {
          name: "USPS Priority Mail",
          mailClass: "PRIORITY_MAIL",
          description: "Fast delivery (1-3 business days)"
        },
        {
          name: "USPS Priority Mail Express",
          mailClass: "PRIORITY_MAIL_EXPRESS",
          description: "Overnight delivery to most locations"
        }
        // Note: First Class Package not included - USPS often doesn't offer it for packages
        // with these dimensions (1x1x1) even though weight (0.5 lbs) qualifies
      ]

      // USPS provider was already fetched earlier, reuse it
      
      if (uspsProvider) {
        // Get default shipping profile
        const profiles = await fulfillmentModule.listShippingProfiles()
        const defaultProfile = profiles[0]
        
        if (defaultProfile && shippingOptionType) {
          // Create or update each shipping method
          for (const method of shippingMethods) {
            const existingOptions = await fulfillmentModule.listShippingOptions({
              name: method.name
            })
            
            if (existingOptions.length === 0) {
              await fulfillmentModule.createShippingOptions({
                name: method.name,
                service_zone_id: serviceZone.id,
                shipping_profile_id: defaultProfile.id,
                provider_id: uspsProvider.id,
                price_type: "calculated",
                shipping_option_type_id: shippingOptionType.id,
                data: {
                  mailClass: method.mailClass,
                  description: method.description
                },
                rules: [
                  {
                    attribute: "enabled_in_store",
                    operator: "eq",
                    value: "true"
                  }
                ]
              })
              logger.info(`   ✓ Created ${method.name}`)
            } else {
              logger.info(`   ✓ ${method.name} exists`)
            }
          }
        } else {
          logger.warn("   ⚠ No shipping profile or option type found")
        }
      } else {
        logger.warn("   ⚠ USPS provider not found - make sure USPS fulfillment module is installed")
      }
    } catch (error: any) {
      logger.warn(`   ⚠ Could not create shipping option: ${error.message}`)
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

    // Get default shipping profile (needed to link products for shipping)
    const shippingProfiles = await fulfillmentModule.listShippingProfiles()
    const defaultShippingProfile = shippingProfiles.find((p: any) => p.name === "Default") || shippingProfiles[0]
    
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
        
        // Link product to shipping profile (makes variants require shipping)
        if (defaultShippingProfile) {
          await remoteLink.create({
            [Modules.PRODUCT]: { product_id: product.id },
            [Modules.FULFILLMENT]: { shipping_profile_id: defaultShippingProfile.id },
          })
        }

        logger.info(`   ✓ Created: ${productData.title} ($${productData.price.toFixed(2)})`)
      }
    } else {
      logger.info(`   ✓ ${existingProducts.length} products already exist`)
      
      // Link existing products to shipping profile if not already linked
      if (defaultShippingProfile) {
        for (const product of existingProducts) {
          try {
            await remoteLink.create({
              [Modules.PRODUCT]: { product_id: product.id },
              [Modules.FULFILLMENT]: { shipping_profile_id: defaultShippingProfile.id },
            })
            logger.info(`   ✓ Linked ${product.title} to shipping profile`)
          } catch (error: any) {
            if (!error.message?.includes('already exists')) {
              logger.warn(`   ⚠ Could not link ${product.title}: ${error.message}`)
            }
          }
        }
      }
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

    // 8. Create product_review table for reviews feature
    logger.info("8. Setting up product reviews table...")
    try {
      const { Client } = require('pg')
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      })
      
      await client.connect()
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS product_review (
          id VARCHAR(255) PRIMARY KEY DEFAULT ('review_' || substr(md5(random()::text || clock_timestamp()::text), 1, 26)),
          product_id VARCHAR(255) NOT NULL,
          customer_id VARCHAR(255) NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          title VARCHAR(500),
          content TEXT,
          verified_purchase BOOLEAN DEFAULT false,
          is_approved BOOLEAN DEFAULT true,
          helpful_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(product_id, customer_id)
        );
      `)
      
      await client.query(`CREATE INDEX IF NOT EXISTS idx_product_review_product_id ON product_review(product_id);`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_product_review_customer_id ON product_review(customer_id);`)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_product_review_approved ON product_review(is_approved);`)
      
      await client.end()
      
      logger.info("   ✓ Created product_review table with indexes")
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        logger.info("   ✓ Product review table already exists")
      } else {
        logger.warn(`   ⚠ Could not create review table: ${error.message}`)
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
