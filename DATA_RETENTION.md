# Data Retention Policy

## Overview

The portal implements an automatic data retention policy for attendee intake data (goals and offers). This ensures compliance with privacy best practices by automatically deleting personal networking data after a specified retention period.

## Retention Period

- **Default**: 60 days after the event ends
- **Configurable**: Each event can have a custom retention period via the `data_retention_days` field
- **Standard Practice**: 30-90 days is typical for event networking data, allowing for post-event follow-ups while maintaining privacy compliance

## What Gets Deleted

After the retention period expires, the following data is automatically deleted:
- `attendee_intakes` records (goals, offers, goals_other, offers_other)
- This does NOT delete:
  - User accounts
  - Registration records
  - Q&A questions/answers
  - Poll votes
  - Survey responses
  - Group assignments (but intake data used for matching is removed)

## Implementation

### Database

The `events` table includes a `data_retention_days` field (default: 60).

### Cleanup Endpoint

**Endpoint**: `/api/cron/cleanup-intake-data`

**Methods**: `GET` or `POST`

**Security**: Protected by `CRON_SECRET_KEY` environment variable (optional but recommended)

**Usage**:
```bash
# With authentication
curl -X POST https://your-domain.com/api/cron/cleanup-intake-data \
  -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"

# Without authentication (if CRON_SECRET_KEY is not set)
curl -X GET https://your-domain.com/api/cron/cleanup-intake-data
```

### Setting Up Automated Cleanup

#### Option 1: External Cron Service (Recommended)

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Create a new cron job
2. Set schedule: Daily at 2 AM UTC (or your preferred time)
3. URL: `https://your-domain.com/api/cron/cleanup-intake-data`
4. Method: `POST`
5. Headers: `Authorization: Bearer YOUR_CRON_SECRET_KEY`
6. Save and activate

#### Option 2: GitHub Actions

Create `.github/workflows/cleanup-intake-data.yml`:

```yaml
name: Cleanup Intake Data

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup
        run: |
          curl -X POST ${{ secrets.CLEANUP_URL }} \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_KEY }}"
```

#### Option 3: Render Cron Job

If deploying on Render, add a cron job service:

```yaml
services:
  - type: cron
    name: cleanup-intake-data
    schedule: "0 2 * * *" # Daily at 2 AM UTC
    buildCommand: echo "No build needed"
    startCommand: curl -X POST https://your-domain.com/api/cron/cleanup-intake-data -H "Authorization: Bearer $CRON_SECRET_KEY"
```

#### Option 4: Supabase Edge Function

Create a Supabase Edge Function that calls the cleanup endpoint or implements the cleanup logic directly.

### Manual Cleanup

You can also trigger cleanup manually via the server action:

```typescript
import { cleanupExpiredIntakeData } from "@/lib/actions/dataRetention";

const result = await cleanupExpiredIntakeData();
console.log(result); // { success: true, totalDeleted: 42, results: [...] }
```

## Consent Language

The retention policy is mentioned in the consent forms:

- **Intake Form**: "Your intake responses will be automatically deleted {retentionDays} days after the event ends, in accordance with our data retention policy."
- **Check-in Consent**: "Your intake responses (goals and offers) will be automatically deleted 60 days after the event ends, in accordance with our data retention policy."

## Environment Variables

Add to your `.env` file:

```env
CRON_SECRET_KEY=your-secret-key-here
```

This key should be a long, random string used to secure the cleanup endpoint.

## Monitoring

The cleanup endpoint returns detailed results:

```json
{
  "success": true,
  "message": "Processed 5 events",
  "totalDeleted": 127,
  "results": [
    {
      "eventId": "uuid-here",
      "deleted": 42,
      "error": null
    }
  ]
}
```

Check your application logs or set up monitoring for the cleanup endpoint to ensure it's running successfully.
