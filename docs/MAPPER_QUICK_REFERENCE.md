# API Response Mapper - Quick Reference

## Import

```typescript
import {
  mapCloudRunApiToProcessedData,
  hasValidData,
  getMappedDataSummary
} from '@/utils/apiResponseMapper';
```

## Basic Usage

```typescript
// 1. Process file
const apiResponse = await processExcelFile(file, 'Supplier', '2025-10');

// 2. Validate
if (!hasValidData(apiResponse)) {
  console.error('No data found');
  return;
}

// 3. Transform
const processedData = mapCloudRunApiToProcessedData(apiResponse);

// 4. Get summary
const summary = getMappedDataSummary(processedData);
console.log(summary);
```

## Field Mappings

| Cloud Run API | Internal Format | Transformation |
|---------------|-----------------|----------------|
| `code` | `product_code` | Direct copy |
| `description` | `product_description` | Direct copy |
| `dto` | `psl_discount` | Multiply by 100 |
| `min_qty` | `minimum_purchase_quantity` | Direct copy |
| N/A | `brand` | Default: "N/A" |
| N/A | `category` | Default: "N/A" |
| N/A | `pvp_discount` | Default: null |
| N/A | `discount_description` | Generated from `dto` |
| N/A | `offer_conditions` | Generated from `min_qty` |

## Common Patterns

### Pattern 1: Basic File Upload

```typescript
async function handleUpload(file: File) {
  try {
    const api = await processExcelFile(file);
    const data = mapCloudRunApiToProcessedData(api);
    
    // Save to Firestore or use in UI
    await saveToFirestore(data);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Pattern 2: With Validation

```typescript
async function handleUploadWithValidation(file: File) {
  const api = await processExcelFile(file);
  
  if (!hasValidData(api)) {
    throw new Error('File contains no valid data');
  }
  
  const data = mapCloudRunApiToProcessedData(api);
  const summary = getMappedDataSummary(data);
  
  if (summary.totalItems === 0) {
    throw new Error('No items found after mapping');
  }
  
  return { data, summary };
}
```

### Pattern 3: React Component

```typescript
function MyComponent() {
  const [data, setData] = useState<ProcessedData | null>(null);
  
  const handleUpload = async (file: File) => {
    const api = await processExcelFile(file);
    
    if (hasValidData(api)) {
      const processed = mapCloudRunApiToProcessedData(api);
      setData(processed);
    }
  };
  
  return (
    <div>
      <FileUploader onUpload={handleUpload} />
      {data && <FileDetail data={data} />}
    </div>
  );
}
```

### Pattern 4: Batch Processing

```typescript
async function processBatch(files: File[]) {
  const results = [];
  
  for (const file of files) {
    try {
      const api = await processExcelFile(file);
      
      if (hasValidData(api)) {
        const data = mapCloudRunApiToProcessedData(api);
        results.push(data);
      }
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
    }
  }
  
  return results;
}
```

## Discount Conversion Examples

```typescript
// API returns decimal, mapper converts to percentage

0.05  →  5
0.07  →  7
0.10  → 10
0.15  → 15
0.20  → 20
0.25  → 25
```

## Combo Grouping Examples

### Input: Products with combo_id

```typescript
products: [
  { code: "A", combo_id: "COMBO-1" },
  { code: "B", combo_id: "COMBO-1" },
  { code: "C" }  // no combo_id
]
```

### Output: Grouped combos

```typescript
products: [
  { product_code: "C" }  // standalone
],
combos: [
  {
    combo_id: "COMBO-1",
    products: [
      { product_code: "A" },
      { product_code: "B" }
    ]
  }
]
```

## Offer Conditions Generation

```typescript
min_qty: 1  → offer_conditions: null
min_qty: 2  → offer_conditions: "Compra mínima: 2 unidades"
min_qty: 5  → offer_conditions: "Compra mínima: 5 unidades"
min_qty: 10 → offer_conditions: "Compra mínima: 10 unidades"
```

## Error Handling

```typescript
try {
  const api = await processExcelFile(file);
  
  // Check for success
  if (!api.success) {
    throw new Error('API processing failed');
  }
  
  // Check for data
  if (!hasValidData(api)) {
    throw new Error('No valid data in file');
  }
  
  // Transform
  const data = mapCloudRunApiToProcessedData(api);
  
  // Additional validation if needed
  if (data.promotions.products.length === 0 && 
      data.promotions.combos.length === 0) {
    throw new Error('Mapping produced no results');
  }
  
  return data;
  
} catch (error) {
  console.error('Processing error:', error);
  throw error;
}
```

## Type Safety

```typescript
import type { CloudRunApiResponse } from '@/types/cloud-run-api';
import type { ProcessedData } from '@/types';

function processFile(api: CloudRunApiResponse): ProcessedData {
  // TypeScript ensures type safety throughout
  const data = mapCloudRunApiToProcessedData(api);
  return data; // ✅ Type-safe
}
```

## Testing

```typescript
import { mapCloudRunApiToProcessedData } from '@/utils/apiResponseMapper';

describe('My Component', () => {
  it('should transform API response', () => {
    const mockApi: CloudRunApiResponse = {
      success: true,
      data: {
        general_data: {
          file_name: 'test.xlsx',
          supplier: 'Test',
          month: '2025-10'
        },
        promotions: {
          products: [{
            code: '123',
            description: 'Test Product',
            dto: 0.10,
            min_qty: 1
          }],
          combos: []
        }
      },
      statistics: { /* ... */ },
      metadata: { /* ... */ }
    };
    
    const result = mapCloudRunApiToProcessedData(mockApi);
    
    expect(result.promotions.products).toHaveLength(1);
    expect(result.promotions.products[0].psl_discount).toBe(10);
  });
});
```

## Performance Considerations

```typescript
// ✅ Good: Transform once, use many times
const data = mapCloudRunApiToProcessedData(api);
renderProducts(data.promotions.products);
renderCombos(data.promotions.combos);
saveToDatabase(data);

// ❌ Bad: Transform multiple times
renderProducts(mapCloudRunApiToProcessedData(api).promotions.products);
renderCombos(mapCloudRunApiToProcessedData(api).promotions.combos);
saveToDatabase(mapCloudRunApiToProcessedData(api));
```

## Summary Statistics

```typescript
const summary = getMappedDataSummary(processedData);

// Returns:
{
  totalProducts: 5,        // Standalone products
  totalCombos: 2,          // Number of combos
  productsInCombos: 8,     // Products within combos
  totalItems: 13           // All items combined
}
```

## Integration with Firestore

```typescript
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function saveProcessedFile(fileId: string, file: File) {
  // Process and transform
  const api = await processExcelFile(file);
  const data = mapCloudRunApiToProcessedData(api);
  const summary = getMappedDataSummary(data);
  
  // Save to Firestore
  await setDoc(doc(db, 'files', fileId), {
    id: fileId,
    name: file.name,
    size: file.size,
    uploadDate: new Date(),
    status: 'Procesado',
    processedData: data,
    summary
  });
}
```

## Filtering Mapped Data

```typescript
// Get products with high discounts
const highDiscountProducts = processedData.promotions.products.filter(
  p => p.psl_discount && p.psl_discount >= 15
);

// Get combos with specific type
const percentageCombos = processedData.promotions.combos.filter(
  c => c.type === 'percentage'
);

// Get products with minimum purchase requirements
const minQtyProducts = processedData.promotions.products.filter(
  p => p.minimum_purchase_quantity && p.minimum_purchase_quantity > 1
);
```

## Exporting Mapped Data

```typescript
import { downloadJSON, downloadCSV } from '@/services/excelProcessorApi';

// Export as JSON
downloadJSON(processedData, 'promotions.json');

// Export products as CSV
downloadCSV(processedData.promotions.products, 'products.csv');
```

## Common Gotchas

### 1. Brand and Category are always "N/A"
```typescript
// ❌ Don't rely on these fields from the mapper
if (product.brand === 'SomeBrand') { }

// ✅ Use product code or description instead
if (product.product_code.startsWith('7791')) { }
```

### 2. Discount types are not distinguished
```typescript
// ❌ pvp_discount is always null
const discount = product.pvp_discount; // null

// ✅ Use psl_discount for all discounts
const discount = product.psl_discount; // actual value
```

### 3. Combo products don't have discount fields
```typescript
// ❌ Combo products don't have psl_discount
combo.products[0].psl_discount // undefined

// ✅ Use the combo-level discount
combo.value // 10 (percentage)
```

## Debugging Tips

```typescript
// 1. Check if API response is valid
console.log('Has valid data:', hasValidData(apiResponse));

// 2. Log the transformation
console.log('Before:', apiResponse.data);
const data = mapCloudRunApiToProcessedData(apiResponse);
console.log('After:', data);

// 3. Check summary stats
const summary = getMappedDataSummary(data);
console.log('Summary:', summary);

// 4. Validate specific products
data.promotions.products.forEach((p, i) => {
  console.log(`Product ${i}:`, {
    code: p.product_code,
    discount: p.psl_discount,
    conditions: p.offer_conditions
  });
});
```

## Related Files

- **Main mapper**: `src/utils/apiResponseMapper.ts`
- **Types**: `src/types/cloud-run-api.ts`, `src/types/index.ts`
- **Tests**: `src/utils/__tests__/apiResponseMapper.test.ts`
- **Examples**: `src/utils/apiResponseMapper.examples.ts`
- **Full docs**: `src/utils/API_RESPONSE_MAPPER_README.md`
- **Data flow**: `docs/MAPPER_DATA_FLOW.md`

## Support

For detailed information, see:
- Full documentation: `src/utils/API_RESPONSE_MAPPER_README.md`
- Data flow diagrams: `docs/MAPPER_DATA_FLOW.md`
- Implementation summary: `MAPPER_IMPLEMENTATION_SUMMARY.md`

