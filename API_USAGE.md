# Global Logging API - Developer Documentation

## Overview

The Global Logging API is a centralized logging service that receives application metrics and events, storing them in BigQuery for analytics and monitoring.

**Base URL:** `https://global-logging-api-969720657837.us-central1.run.app`

---

## Endpoints

| Method | Endpoint       | Description                                    |
|--------|----------------|------------------------------------------------|
| POST   | `/logs`        | Insert a single log entry                      |
| POST   | `/logs/batch`  | Insert multiple log entries (max 500/request)  |
| GET    | `/health`      | Health check endpoint                          |

---

## Log Entry Schema

### Required Fields

| Field             | Type      | Description                                           |
|-------------------|-----------|-------------------------------------------------------|
| `event_timestamp` | ISO 8601  | UTC timestamp of when the event was recorded          |
| `event_id`        | String    | Unique UUID for each log entry (prevents duplicates)  |
| `app_id`          | String    | Unique identifier of the application (e.g., `finance-v1`) |
| `entry_category`  | String    | High-level grouping: `LOGIN`, `ERROR`, `ACTION`, `VIEW` |

### Optional Fields

| Field             | Type      | Description                                           |
|-------------------|-----------|-------------------------------------------------------|
| `app_version`     | String    | Semantic version or build ID (e.g., `2.1.0`)          |
| `environment`     | String    | Deployment tier: `PROD`, `STAGING`, `DEV`             |
| `user_id`         | String    | Employee ID or unique user identifier                 |
| `user_email`      | String    | Email address of the user                             |
| `user_department` | String    | Department of the user                                |
| `session_id`      | String    | Unique session identifier                             |
| `user_role`       | String    | Access level: `ADMIN`, `EDITOR`, `VIEWER`             |
| `event_name`      | String    | Specific action name (e.g., `click_export_button`)    |
| `page_path`       | String    | URL or route where the event occurred                 |
| `metadata`        | Object/String | Flexible JSON object for custom data (accepts object or JSON string) |
| `latency_ms`      | Integer   | Duration or API response time in milliseconds         |
| `status_code`     | Integer   | HTTP or internal status code                          |
| `is_error`        | Boolean   | `true` if the entry represents a failure              |
| `device_type`     | String    | Hardware: `DESKTOP`, `MOBILE`, `TABLET`               |
| `browser`         | String    | Browser name and version                              |
| `os`              | String    | Operating system of the device                        |

---

## API Reference

### POST /logs

Insert a single log entry.

**Request:**

```http
POST /logs
Content-Type: application/json

{
  "event_timestamp": "2025-12-22T10:30:00Z",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "app_id": "finance-v1",
  "app_version": "2.1.0",
  "environment": "PROD",
  "entry_category": "ACTION",
  "user_id": "EMP12345",
  "user_email": "john.doe@company.com",
  "user_department": "Finance",
  "session_id": "sess-abc123",
  "user_role": "EDITOR",
  "event_name": "click_export_button",
  "page_path": "/reports/monthly",
  "metadata": {
    "report_type": "sales",
    "format": "xlsx",
    "row_count": 1500
  },
  "latency_ms": 245,
  "status_code": 200,
  "is_error": false,
  "device_type": "DESKTOP",
  "browser": "Chrome 120.0",
  "os": "Windows 11"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Successfully inserted 1 log(s)",
  "inserted_count": 1,
  "errors": null
}
```

**Response (Validation Error - 400):**

```json
{
  "success": false,
  "message": "Validation error",
  "inserted_count": null,
  "errors": [
    "event_id: Field required",
    "entry_category: Field required"
  ]
}
```

---

### POST /logs/batch

Insert multiple log entries in a single request (maximum 500 entries).

**Request:**

```http
POST /logs/batch
Content-Type: application/json

{
  "logs": [
    {
      "event_timestamp": "2025-12-22T10:30:00Z",
      "event_id": "log-001",
      "app_id": "finance-v1",
      "entry_category": "VIEW",
      "user_email": "jane.doe@company.com",
      "page_path": "/dashboard"
    },
    {
      "event_timestamp": "2025-12-22T10:30:05Z",
      "event_id": "log-002",
      "app_id": "finance-v1",
      "entry_category": "ACTION",
      "event_name": "filter_applied"
    }
  ]
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "message": "Successfully inserted 2 log(s)",
  "inserted_count": 2,
  "errors": null
}
```

---

### GET /health

Health check endpoint for monitoring and load balancers.

**Response (200):**

```json
{
  "status": "healthy"
}
```

---

## Code Examples

### cURL

**Single Log:**

```bash
curl -X POST https://global-logging-api-969720657837.us-central1.run.app/logs \
  -H "Content-Type: application/json" \
  -d '{
    "event_timestamp": "2025-12-22T10:30:00Z",
    "event_id": "'"$(uuidgen)"'",
    "app_id": "my-app",
    "entry_category": "ACTION",
    "user_email": "user@example.com",
    "event_name": "button_click"
  }'
```

**Batch Insert:**

```bash
curl -X POST https://global-logging-api-969720657837.us-central1.run.app/logs/batch \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [
      {"event_timestamp": "2025-12-22T10:30:00Z", "event_id": "log-1", "app_id": "my-app", "entry_category": "VIEW"},
      {"event_timestamp": "2025-12-22T10:30:01Z", "event_id": "log-2", "app_id": "my-app", "entry_category": "ACTION"}
    ]
  }'
```

---

### Python

```python
import requests
import uuid
from datetime import datetime, timezone

API_URL = "https://global-logging-api-969720657837.us-central1.run.app"

def send_log(app_id: str, entry_category: str, event_name: str = None, **kwargs):
    """Send a single log entry to the Global Logging API."""
    payload = {
        "event_timestamp": datetime.now(timezone.utc).isoformat(),
        "event_id": str(uuid.uuid4()),
        "app_id": app_id,
        "entry_category": entry_category,
        **kwargs
    }
    
    if event_name:
        payload["event_name"] = event_name
    
    response = requests.post(f"{API_URL}/logs", json=payload)
    return response.json()

def send_batch_logs(logs: list):
    """Send multiple log entries in a single request."""
    response = requests.post(f"{API_URL}/logs/batch", json={"logs": logs})
    return response.json()

# Example usage
result = send_log(
    app_id="finance-v1",
    entry_category="ACTION",
    event_name="export_report",
    user_id="EMP12345",
    user_email="john.doe@company.com",
    metadata={"format": "xlsx"}
)
print(result)
```

---

### JavaScript / TypeScript

```javascript
const API_URL = 'https://global-logging-api-969720657837.us-central1.run.app';

/**
 * Send a single log entry to the Global Logging API
 */
async function sendLog(appId, entryCategory, options = {}) {
  const payload = {
    event_timestamp: new Date().toISOString(),
    event_id: crypto.randomUUID(),
    app_id: appId,
    entry_category: entryCategory,
    ...options
  };

  const response = await fetch(`${API_URL}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return response.json();
}

/**
 * Send multiple log entries in a batch
 */
async function sendBatchLogs(logs) {
  const response = await fetch(`${API_URL}/logs/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs })
  });

  return response.json();
}

// Example usage
sendLog('finance-v1', 'ACTION', {
  event_name: 'click_export_button',
  user_id: 'EMP12345',
  user_email: 'john.doe@company.com',
  page_path: '/reports/monthly',
  metadata: { report_type: 'sales' }
}).then(console.log);
```

---

### C# / .NET

```csharp
using System.Net.Http.Json;

public class LoggingClient
{
    private readonly HttpClient _client;
    private readonly string _baseUrl;

    public LoggingClient(string baseUrl)
    {
        _client = new HttpClient();
        _baseUrl = baseUrl;
    }

    public async Task<LogResponse> SendLogAsync(LogEntry entry)
    {
        var response = await _client.PostAsJsonAsync($"{_baseUrl}/logs", entry);
        return await response.Content.ReadFromJsonAsync<LogResponse>();
    }

    public async Task<LogResponse> SendBatchAsync(List<LogEntry> logs)
    {
        var response = await _client.PostAsJsonAsync($"{_baseUrl}/logs/batch", new { logs });
        return await response.Content.ReadFromJsonAsync<LogResponse>();
    }
}

public record LogEntry(
    DateTime EventTimestamp,
    string EventId,
    string AppId,
    string EntryCategory,
    string? EventName = null,
    string? UserId = null,
    string? UserEmail = null,
    Dictionary<string, object>? Metadata = null
);

public record LogResponse(bool Success, string Message, int? InsertedCount);
```

---

## Best Practices

### 1. Entry Categories

Use the appropriate category for each log type:

| Category | When to Use                                      |
|----------|--------------------------------------------------|
| `LOGIN`  | User authentication events (login, logout, MFA)  |
| `ERROR`  | Application errors and exceptions                |
| `ACTION` | User interactions (clicks, form submissions)     |
| `VIEW`   | Page views and screen impressions                |

### 2. Event IDs

- Always generate a unique UUID for each log entry
- This prevents duplicate entries in analytics
- Use `uuid.uuid4()` in Python or `crypto.randomUUID()` in JavaScript

### 3. Timestamps

- Always use UTC timestamps in ISO 8601 format
- Include timezone information: `2025-12-22T10:30:00Z`

### 4. Batch vs Single Inserts

- Use **single inserts** (`/logs`) for real-time critical events
- Use **batch inserts** (`/logs/batch`) for:
  - High-volume event streams
  - Background analytics collection
  - Reducing API calls (max 500 logs per batch)

### 5. Metadata Field

Use the `metadata` field for app-specific data that doesn't fit standard fields. The API accepts both JSON objects and JSON strings:

```json
// As object (preferred)
{
  "metadata": {
    "report_id": "rpt-12345",
    "filters_applied": ["date", "department"]
  }
}

// As JSON string (also supported)
{
  "metadata": "{\"report_id\":\"rpt-12345\"}"
}
```

---

## Error Handling

| Status Code | Description                    | Action                           |
|-------------|--------------------------------|----------------------------------|
| 201         | Success                        | Log inserted successfully        |
| 400         | Validation Error               | Check request payload            |
| 404         | Not Found                      | Check endpoint URL               |
| 500         | Server Error                   | Retry with exponential backoff   |

### Retry Strategy

For production applications, implement retry logic:

```python
import time
import requests

def send_log_with_retry(payload, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.post(f"{API_URL}/logs", json=payload, timeout=10)
            if response.status_code == 201:
                return response.json()
            elif response.status_code >= 500:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                return response.json()  # Client error, don't retry
        except requests.RequestException:
            time.sleep(2 ** attempt)
    return {"success": False, "message": "Max retries exceeded"}
```

---

## Rate Limits

- No explicit rate limits are enforced at the API level
- BigQuery streaming insert quotas apply (100,000 rows/second per table)
- For very high volume, consider batching logs client-side

---

## Support

For issues or questions, contact the CDS Platform Team.

