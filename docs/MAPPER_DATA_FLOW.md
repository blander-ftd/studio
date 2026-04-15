# API Response Mapper - Data Flow Diagram

## Overview

This document visualizes how data flows through the mapper from the Cloud Run API to the file detail views.

## High-Level Flow

```
┌─────────────────┐
│   Excel File    │
│   (.xlsx)       │
└────────┬────────┘
         │
         │ Upload
         ▼
┌─────────────────────────────────┐
│  Cloud Run Excel Processor API  │
│  (External Service)              │
└────────┬────────────────────────┘
         │
         │ Returns CloudRunApiResponse
         │
         ▼
    ┌────────────────────────────────────────┐
    │  {                                     │
    │    "success": true,                    │
    │    "data": {                           │
    │      "general_data": { ... },         │
    │      "promotions": {                   │
    │        "products": [                   │
    │          {                             │
    │            "code": "7791909116017",    │
    │            "description": "ACLUSIN",   │
    │            "dto": 0.07,                │
    │            "min_qty": 1                │
    │          }                             │
    │        ],                              │
    │        "combos": []                    │
    │      }                                 │
    │    }                                   │
    │  }                                     │
    └────────┬───────────────────────────────┘
             │
             │ Transform
             │ mapCloudRunApiToProcessedData()
             ▼
    ┌────────────────────────────────────────┐
    │  ProcessedData (Internal Format)       │
    │  {                                     │
    │    "general_data": { ... },           │
    │    "promotions": {                     │
    │      "products": [                     │
    │        {                               │
    │          "product_code": "779...",    │
    │          "product_description": "...", │
    │          "brand": "N/A",              │
    │          "category": "N/A",           │
    │          "psl_discount": 7,           │
    │          "pvp_discount": null,        │
    │          "discount_description": ..., │
    │          "minimum_purchase_qty": 1,   │
    │          "offer_conditions": null     │
    │        }                               │
    │      ],                                │
    │      "combos": []                      │
    │    }                                   │
    │  }                                     │
    └────────┬───────────────────────────────┘
             │
             │ Save to Firestore
             │
             ▼
    ┌─────────────────┐
    │   Firestore     │
    │   files/{id}    │
    └────────┬────────┘
             │
             │ Read
             │
             ▼
    ┌─────────────────┐
    │  File Detail    │
    │  View Component │
    └─────────────────┘
```

## Detailed Transformation Process

### Step 1: Product Transformation

```
Cloud Run Product                    Internal Product
─────────────────                    ────────────────

{                                    {
  code: "7791909116017"     ──►        product_code: "7791909116017"
  description: "ACLUSIN"    ──►        product_description: "ACLUSIN"
  dto: 0.07                 ──►        psl_discount: 7
                            ──►        pvp_discount: null
                            ──►        brand: "N/A"
                            ──►        category: "N/A"
                            ──►        discount_description: "7.00% de descuento"
  min_qty: 1                ──►        minimum_purchase_quantity: 1
                            ──►        offer_conditions: null
}                                    }

Transformations Applied:
├─ Rename: code → product_code
├─ Rename: description → product_description
├─ Convert: dto (0.07) → psl_discount (7)
├─ Generate: discount_description from dto
├─ Generate: offer_conditions from min_qty
└─ Add defaults: brand, category, pvp_discount
```

### Step 2: Combo Grouping

```
Cloud Run Products with combo_id     Internal Combo
────────────────────────────────     ──────────────

products: [                          combos: [
  {                                    {
    code: "111",                         combo_id: "COMBO-A"
    description: "Product 1",            type: "percentage"
    dto: 0.10,                          value: 10
    combo_id: "COMBO-A"                 products: [
  },                                      {
  {                                        product_code: "111"
    code: "222",                          product_description: "Product 1"
    description: "Product 2",             brand: "N/A"
    dto: 0.10,                            category: "N/A"
    combo_id: "COMBO-A"                   minimum_purchase_quantity: null
  }                                      },
]                                        {
                                           product_code: "222"
                                           product_description: "Product 2"
                                           brand: "N/A"
                                           category: "N/A"
                                           minimum_purchase_quantity: null
                                         }
                                       ]
                                     }
                                   ]

Transformation Logic:
├─ Group by combo_id
├─ Use first product's dto for combo discount
├─ Convert dto to percentage
├─ Determine type (percentage vs fixed)
└─ Transform each product in combo
```

### Step 3: Discount Conversion

```
API Format (Decimal)          Internal Format (Percentage)
────────────────────          ────────────────────────────

dto: 0.05      ──►  5%        psl_discount: 5
                              discount_description: "5.00% de descuento"

dto: 0.07      ──►  7%        psl_discount: 7
                              discount_description: "7.00% de descuento"

dto: 0.15      ──► 15%        psl_discount: 15
                              discount_description: "15.00% de descuento"

dto: 0.20      ──► 20%        psl_discount: 20
                              discount_description: "20.00% de descuento"

dto: undefined ──► null       psl_discount: null
                              discount_description: "Sin descuento"

Formula: percentage = decimal × 100
```

### Step 4: Offer Conditions Generation

```
API min_qty              Internal offer_conditions
───────────              ─────────────────────────

min_qty: 1      ──►      null
min_qty: 2      ──►      "Compra mínima: 2 unidades"
min_qty: 5      ──►      "Compra mínima: 5 unidades"
min_qty: 10     ──►      "Compra mínima: 10 unidades"
min_qty: null   ──►      null

Logic: if min_qty > 1, generate Spanish text
```

## Component Integration Flow

```
┌──────────────────────────────────────────────────────────┐
│  Excel Processor Page                                     │
│  /dashboard/excel-processor                               │
│                                                            │
│  ┌────────────────┐                                       │
│  │ ExcelUploader  │                                       │
│  │                │                                       │
│  │ [Upload File]  │                                       │
│  └───────┬────────┘                                       │
│          │                                                 │
│          │ 1. processExcelFile()                          │
│          ▼                                                 │
│  ┌──────────────────────┐                                │
│  │ Cloud Run API        │                                │
│  │ Returns: ApiResponse │                                │
│  └──────┬───────────────┘                                │
│         │                                                  │
│         │ 2. onUploadSuccess(apiResponse)                 │
│         ▼                                                  │
│  ┌──────────────────────────────────────┐                │
│  │ handleUploadSuccess()                 │                │
│  │                                       │                │
│  │ 3. hasValidData(apiResponse)          │                │
│  │    ├─ Check products array            │                │
│  │    └─ Check combos array              │                │
│  │                                       │                │
│  │ 4. mapCloudRunApiToProcessedData()    │                │
│  │    ├─ Map products                    │                │
│  │    ├─ Group combos                    │                │
│  │    └─ Transform structure             │                │
│  │                                       │                │
│  │ 5. getMappedDataSummary()             │                │
│  │    └─ Calculate statistics            │                │
│  │                                       │                │
│  │ 6. setMappedData(processedData)       │                │
│  └──────┬───────────────────────────────┘                │
│         │                                                  │
│         ▼                                                  │
│  ┌──────────────────────┐                                │
│  │ Display Results:     │                                │
│  │ - Raw API data       │                                │
│  │ - Transformed data   │                                │
│  │ - Summary stats      │                                │
│  └──────────────────────┘                                │
└──────────────────────────────────────────────────────────┘
```

## Data Structure Comparison

### Cloud Run API Response Structure

```typescript
CloudRunApiResponse {
  success: boolean
  data: {
    general_data: {
      file_name: string
      supplier: string
      month: string
    }
    promotions: {
      products: CloudRunProduct[] {
        code?: string
        description?: string
        dto?: number        // Decimal (0.07 = 7%)
        min_qty?: number
        combo_id?: string
      }
      combos: CloudRunCombo[] {
        code?: string
        description?: string
        dto?: number
        min_qty?: number
      }
    }
  }
  statistics: { ... }
  metadata: { ... }
}
```

### Internal ProcessedData Structure

```typescript
ProcessedData {
  general_data: {
    file_name: string
    supplier: string
    month: string
  }
  promotions: {
    products: ProductPromotion[] {
      product_code: string
      product_description: string
      brand: string
      category: string
      psl_discount: number | null     // Percentage (7)
      pvp_discount: number | null
      discount_description: string
      minimum_purchase_quantity: number | null
      offer_conditions: string | null
    }
    combos: ComboPromotion[] {
      type: "percentage" | "fixed" | null
      value: number | null             // Percentage (10)
      combo_id: string
      products: ComboProduct[] {
        product_code: string
        product_description: string
        brand: string
        category: string
        minimum_purchase_quantity: number | null
      }
    }
  }
}
```

## Mapper Function Relationships

```
                    ┌────────────────────────────────┐
                    │ mapCloudRunApiToProcessedData  │
                    │ (Main Entry Point)             │
                    └───────────┬────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
    ┌──────────────────────┐      ┌──────────────────────┐
    │ groupProductsByCombos│      │  mapCloudRunProduct  │
    │                      │      │                      │
    │ Groups products with │      │ Transforms single    │
    │ same combo_id        │      │ product              │
    └──────────┬───────────┘      └──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ createComboFromProducts│
    │                      │
    │ Creates combo from   │
    │ grouped products     │
    └──────────────────────┘

Helper Functions:
├─ hasValidData(apiResponse): boolean
│  └─ Validates response has products or combos
│
├─ getMappedDataSummary(processedData): Summary
│  └─ Calculates statistics about mapped data
│
└─ validateMappedData(processedData): Validation
   └─ Checks data quality and returns issues
```

## Error Handling Flow

```
┌─────────────────┐
│ Upload Excel    │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ processExcelFile()  │
└────────┬────────────┘
         │
         │ Success?
         ├─ No ──► Error: API failure, network issue
         │         └─ Display error message
         │
         ▼ Yes
┌─────────────────────┐
│ hasValidData()?     │
└────────┬────────────┘
         │
         │ Valid?
         ├─ No ──► Warning: Empty file
         │         └─ Display "No data found"
         │
         ▼ Yes
┌─────────────────────────────┐
│ mapCloudRunApiToProcessedData│
└────────┬────────────────────┘
         │
         │ Success
         ▼
┌─────────────────────┐
│ validateMappedData()│
└────────┬────────────┘
         │
         │ Valid?
         ├─ No ──► Warning: Data quality issues
         │         └─ Display warnings
         │
         ▼ Yes
┌─────────────────────┐
│ Display Results     │
└─────────────────────┘
```

## Real-World Example

### Input: Excel File with Products and Combos

```
Excel File: promociones_octubre.xlsx
Supplier: Farmacia Central
Month: 2025-10

Products:
- ACLUSIN 50 MG (7791909116017) - 7% discount, min 1
- ASPIRINA 500 MG (7798123456789) - 15% discount, min 3
- IBUPROFENO 400 MG (7798234567890) - 10% discount, combo A
- PARACETAMOL 500 MG (7798345678901) - 10% discount, combo A
```

### Cloud Run API Response

```json
{
  "success": true,
  "data": {
    "general_data": {
      "file_name": "promociones_octubre.xlsx",
      "supplier": "Farmacia Central",
      "month": "2025-10"
    },
    "promotions": {
      "products": [
        {
          "code": "7791909116017",
          "description": "ACLUSIN 50 MG",
          "dto": 0.07,
          "min_qty": 1
        },
        {
          "code": "7798123456789",
          "description": "ASPIRINA 500 MG",
          "dto": 0.15,
          "min_qty": 3
        },
        {
          "code": "7798234567890",
          "description": "IBUPROFENO 400 MG",
          "dto": 0.10,
          "min_qty": 1,
          "combo_id": "COMBO-A"
        },
        {
          "code": "7798345678901",
          "description": "PARACETAMOL 500 MG",
          "dto": 0.10,
          "min_qty": 1,
          "combo_id": "COMBO-A"
        }
      ],
      "combos": []
    }
  }
}
```

### After Mapping (ProcessedData)

```json
{
  "general_data": {
    "file_name": "promociones_octubre.xlsx",
    "supplier": "Farmacia Central",
    "month": "2025-10"
  },
  "promotions": {
    "products": [
      {
        "product_code": "7791909116017",
        "product_description": "ACLUSIN 50 MG",
        "brand": "N/A",
        "category": "N/A",
        "psl_discount": 7,
        "pvp_discount": null,
        "discount_description": "7.00% de descuento",
        "minimum_purchase_quantity": 1,
        "offer_conditions": null
      },
      {
        "product_code": "7798123456789",
        "product_description": "ASPIRINA 500 MG",
        "brand": "N/A",
        "category": "N/A",
        "psl_discount": 15,
        "pvp_discount": null,
        "discount_description": "15.00% de descuento",
        "minimum_purchase_quantity": 3,
        "offer_conditions": "Compra mínima: 3 unidades"
      }
    ],
    "combos": [
      {
        "combo_id": "COMBO-A",
        "type": "percentage",
        "value": 10,
        "products": [
          {
            "product_code": "7798234567890",
            "product_description": "IBUPROFENO 400 MG",
            "brand": "N/A",
            "category": "N/A",
            "minimum_purchase_quantity": 1
          },
          {
            "product_code": "7798345678901",
            "product_description": "PARACETAMOL 500 MG",
            "brand": "N/A",
            "category": "N/A",
            "minimum_purchase_quantity": 1
          }
        ]
      }
    ]
  }
}
```

### Summary Statistics

```
Total Products: 2
Total Combos: 1
Products in Combos: 2
Total Items: 4
```

## Conclusion

The mapper provides a clean separation between the external API format and the internal data structure, making it easy to:

1. Change the API without affecting the UI
2. Add data enrichment (brand, category)
3. Customize discount calculations
4. Handle complex combo structures
5. Maintain data consistency across the application

