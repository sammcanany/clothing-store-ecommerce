# USPS Fulfillment Provider Module

This module provides USPS shipping rate calculation for Medusa e-commerce.

## Structure

```
usps-fulfillment/
├── index.ts           # Module entry point
├── service.ts         # Fulfillment provider service (main logic)
├── usps-client.ts     # USPS API client
├── types.ts           # TypeScript type definitions
└── README.md          # This file
```

## Files

### `index.ts`
Module definition that exports the USPS provider service to Medusa.

### `service.ts`
Main fulfillment provider service implementing Medusa's `AbstractFulfillmentProviderService`:
- `getFulfillmentOptions()` - Returns available USPS mail classes
- `calculatePrice()` - Calculates shipping rates using USPS API
- `validateFulfillmentData()` - Validates shipping data
- `createFulfillment()` - Handles order fulfillment
- Helper methods for weight/dimension calculation

### `usps-client.ts`
HTTP client for USPS API:
- OAuth2 authentication
- Rate calculation via `/prices/v3/total-rates/search`
- Address validation via `/addresses/v3/address`
- Token management and refresh

### `types.ts`
TypeScript interfaces and types for:
- Configuration options
- API requests/responses
- Mail classes and price types
- Address structures

## Configuration

The module is configured in `medusa-config.ts`:

```typescript
{
  resolve: "@medusajs/medusa/fulfillment",
  options: {
    providers: [
      {
        resolve: "./src/modules/usps-fulfillment",
        id: "usps",
        options: {
          clientId: process.env.USPS_CLIENT_ID,
          clientSecret: process.env.USPS_CLIENT_SECRET,
          environment: process.env.USPS_ENVIRONMENT || "testing",
          originZIPCode: process.env.WAREHOUSE_ZIP,
          defaultMailClass: "PRIORITY_MAIL",
        },
      },
    ],
  },
}
```

## Environment Variables

Required:
- `USPS_CLIENT_ID` - USPS API OAuth2 client ID
- `USPS_CLIENT_SECRET` - USPS API OAuth2 client secret
- `WAREHOUSE_ZIP` - Warehouse/shipping origin ZIP code

Optional:
- `USPS_ENVIRONMENT` - "testing" or "production" (default: "testing")

## Supported Mail Classes

- `PRIORITY_MAIL` - USPS Priority Mail (1-3 days)
- `PRIORITY_MAIL_EXPRESS` - USPS Priority Mail Express (overnight-2 days)
- `USPS_GROUND_ADVANTAGE` - USPS Ground Advantage (2-5 days)
- `FIRST_CLASS_PACKAGE_SERVICE` - First-Class Package Service (1-5 days)

## API Endpoints Used

### USPS OAuth2
- `POST /oauth2/v3/token` - Get access token

### USPS Prices API
- `POST /prices/v3/total-rates/search` - Calculate shipping rates

### USPS Addresses API
- `GET /addresses/v3/address` - Validate and standardize addresses

## Dependencies

- `axios` - HTTP client for API requests

## Customization

### Adding Mail Classes

Edit `getFulfillmentOptions()` in `service.ts`:

```typescript
{
  id: "usps-custom",
  name: "USPS Custom Service",
  data: {
    mailClass: "CUSTOM_MAIL_CLASS",
  },
}
```

### Weight Calculation

Edit `calculateWeight()` in `service.ts` to use your product data model.

### Dimensions

Edit `calculateDimensions()` in `service.ts` for accurate package sizing.

## Error Handling

The client throws errors for:
- Authentication failures
- Invalid API responses
- Network issues
- Rate calculation errors

All errors are logged using Medusa's logger.

## Testing

Use `USPS_ENVIRONMENT=testing` to test against USPS sandbox API without affecting production or incurring costs.

## Future Enhancements

Potential additions:
- Label printing via USPS Labels API
- Tracking integration
- Pickup scheduling
- Return label generation
- International shipping support
- Multi-package support

## License

This module is part of your Medusa application.
