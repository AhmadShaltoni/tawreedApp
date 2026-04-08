# Backend Developer - Notices Management API

## Requirement: Admin-Managed Notices/Announcements

Add RESTful endpoints for managing rotating banners displayed on the Home screen of the Tawreed mobile app.

---

## API Endpoints

### 1. GET /api/v1/notices (Public)

Fetch all active notices for the mobile app to display in rotation.

**Authentication**: None required (public endpoint)

**Query Parameters**: None

**Response**:

```json
{
  "notices": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "text": "توصيل مجاني للطلبات أكثر من 50 دينار",
      "backgroundColor": "#FFA500",
      "textColor": "#FFFFFF",
      "isActive": true,
      "createdAt": "2026-04-06T10:00:00Z",
      "updatedAt": "2026-04-06T10:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "text": "عرض جديد: خصم 20% على جميع المنتجات",
      "backgroundColor": "#22c55e",
      "textColor": "#FFFFFF",
      "isActive": true,
      "createdAt": "2026-04-05T15:30:00Z",
      "updatedAt": "2026-04-05T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 50
  }
}
```

**HTTP Status**:

- 200 OK - Success
- 500 Internal Server Error

---

### 2. POST /api/v1/notices (Admin Only - Dashboard)

Create a new notice/announcement.

**Authentication**: Required (Admin token in Bearer header)

**Request Body**:

```json
{
  "text": "Notice text (required, max 255 chars)",
  "backgroundColor": "#HEX_COLOR (optional, defaults to #FFA500)",
  "textColor": "#HEX_COLOR (optional, defaults to #FFFFFF)"
}
```

**Response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "text": "توصيل مجاني للطلبات أكثر من 50 دينار",
  "backgroundColor": "#FFA500",
  "textColor": "#FFFFFF",
  "isActive": true,
  "createdAt": "2026-04-06T10:00:00Z",
  "updatedAt": "2026-04-06T10:00:00Z"
}
```

**Validation**:

- `text` is required and must be 1-255 characters
- `backgroundColor` and `textColor` must be valid hex colors if provided
- Admin authorization required

---

### 3. PATCH /api/v1/notices/:id (Admin Only - Dashboard)

Update an existing notice.

**Authentication**: Required (Admin token in Bearer header)

**URL Parameter**:

- `id` - UUID of the notice

**Request Body** (all optional):

```json
{
  "text": "Updated notice text",
  "backgroundColor": "#NEW_HEX_COLOR",
  "textColor": "#NEW_HEX_COLOR",
  "isActive": false
}
```

**Response** (200 OK):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "text": "Updated notice text",
  "backgroundColor": "#NEW_HEX_COLOR",
  "textColor": "#NEW_HEX_COLOR",
  "isActive": false,
  "createdAt": "2026-04-06T10:00:00Z",
  "updatedAt": "2026-04-06T11:30:00Z"
}
```

**Validation**:

- If provided, `text` must be 1-255 characters
- If provided, colors must be valid hex format
- Admin authorization required
- Return 404 if notice not found

---

### 4. DELETE /api/v1/notices/:id (Admin Only - Dashboard)

Soft delete a notice (set `isActive` to false).

**Authentication**: Required (Admin token in Bearer header)

**URL Parameter**:

- `id` - UUID of the notice

**Response** (200 OK):

```json
{
  "message": "Notice deleted successfully"
}
```

**Alternative** (204 No Content):
Just return empty response

**Validation**:

- Admin authorization required
- Return 404 if notice not found
- This is a soft delete: set `isActive = false` instead of removing from DB

---

## Database Schema

Create a `notices` table in PostgreSQL:

```sql
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text VARCHAR(255) NOT NULL,
  backgroundColor VARCHAR(7) DEFAULT '#FFA500',
  textColor VARCHAR(7) DEFAULT '#FFFFFF',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL,

  -- Indexes
  INDEX idx_active (isActive),
  INDEX idx_created (createdAt DESC)
);
```

---

## Admin Dashboard Integration

### Required Features:

1. **List Notices**
   - Show all notices (both active and inactive)
   - Display: text, colors, active status, created date, updated date
   - Allow sorting by date or status
   - Support pagination (10-20 per page)

2. **Create Notice**
   - Form fields: text input, color pickers (optional)
   - Validate text length (1-255)
   - Show preview of notice as it will appear in the app
   - Default colors: background #FFA500, text #FFFFFF

3. **Edit Notice**
   - Pre-populate form with current values
   - Allow toggling active/inactive status
   - Show when notice was created/updated
   - Same preview as create

4. **Delete Notice**
   - Soft delete with confirmation dialog
   - Maintain audit trail (record in `deletedAt`)

5. **Color Picker**
   - Provide color picker UI for background and text colors
   - Store as hex values (e.g., "#FFA500")
   - Provide preset colors:
     - Warning: #FFA500, #FFB81C, #FFC107
     - Success: #22c55e, #10b981, #34d399
     - Info: #3b82f6, #0ea5e9, #06b6d4
     - Error: #ef4444, #e11d48, #dc2626
     - Custom: color picker

---

## Implementation Notes

- **GET /api/v1/notices** returns only `notices` with `isActive=true`
- Other endpoints filter `isActive=true` in queries unless specifically checking both
- Use timestamps with ISO 8601 format (UTC)
- Implement proper error messages for validation failures
- Consider rate limiting for admin endpoints
- Use transactions for update operations to maintain consistency

---

## Frontend Integration Status

✅ Frontend is ready to consume this API:

- Notices fetched on Home screen load
- Refreshed with pull-to-refresh
- Rotates every 10 seconds with fade animation
- Displays in a banner at the top of the screen
- Hides automatically if no notices exist

---

## Testing Checklist

- [ ] GET /api/v1/notices returns active notices
- [ ] GET /api/v1/notices with no active notices returns empty array
- [ ] POST creates new notice with correct fields
- [ ] PATCH updates notice fields
- [ ] PATCH can toggle isActive status
- [ ] DELETE soft deletes (sets isActive=false)
- [ ] Admin authorization required for POST/PATCH/DELETE (401 if not authorized)
- [ ] Invalid text length returns validation error
- [ ] Invalid hex colors return validation error
- [ ] 404 returned for non-existent notice on PATCH/DELETE
