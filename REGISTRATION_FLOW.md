# Registration & Data Collection Flow

## Overview
The portal implements a **clear separation** between event registration/login and optional data collection for networking signals.

## Flow Architecture

### 1. Event Registration (Luma)
- Users register on Luma (external platform)
- Provides email for attendance confirmation
- This is the **only required step** to attend the event

### 2. On-Site Check-In
- Staff checks in attendees using their email
- Creates a portal session (cookie-based, no traditional login)
- **Immediately redirects to `/[eventSlug]/agenda`** (no forced intake)

### 3. Optional Data Collection (Signals)
After check-in, users see an **optional opt-in banner** on the agenda and other pages:

```
┌─────────────────────────────────────────────────┐
│ ✨ Enhance Your Networking                      │
│                                                  │
│ Share what you're looking for and what you can  │
│ offer to help us match you with the right       │
│ people. This is completely optional...          │
│                                                  │
│ [Share Signals]  [Maybe Later]                  │
└─────────────────────────────────────────────────┘
```

**Key Points:**
- Banner can be dismissed (stored in localStorage)
- Dismissal is persistent per event
- Banner appears on agenda, Q&A, and other main pages
- Users can access the intake form anytime via the banner

### 4. Signals/Intake Form
If users choose to share their signals:
- **Step 1:** What are you looking for? (goals)
- **Step 2:** What can you share? (offers)
- Clear consent language at the top of the form
- "Skip for Now" button on every step
- Explains: "Data is only used for this event and will not be shared externally"

**Data collected (all optional):**
- Goals: learn-ai, networking, find-cofounders, etc.
- Offers: ai-expertise, software-dev, mentorship, etc.
- Custom "other" text for both categories

### 5. Portal Access
Users can participate in **ALL portal features** regardless of intake completion:
- ✅ View agenda
- ✅ Ask questions (Q&A)
- ✅ Vote on polls
- ✅ Access resources
- ✅ Submit feedback surveys

No feature is gated behind the signals opt-in.

## Data Usage

### What the signals are used for:
1. **Group Formation** (admin-only feature)
   - Admins can use AI to suggest groups based on complementary goals/offers
   - Only shown to admins in the `/admin/[eventSlug]/groups` page

2. **Analytics Insights** (admin-only)
   - Aggregated stats on attendee interests
   - No individual data is exposed in analytics

### What the signals are NOT used for:
- ❌ Gating access to portal features
- ❌ Connecting to specific survey responses
- ❌ External sharing or marketing
- ❌ Identifying individuals (except for group formation)

## Technical Implementation

### Files:
- `portal/src/components/forms/AttendeeCheckinForm.tsx` - Redirects to `/agenda` after check-in
- `portal/src/components/banners/IntakeOptInBanner.tsx` - Optional banner component
- `portal/src/app/[eventSlug]/intake/page.tsx` - Signals form with consent language
- `portal/src/components/forms/IntakeForm.tsx` - Two-step form with skip buttons
- `portal/src/app/[eventSlug]/agenda/page.tsx` - Shows banner if intake not completed
- `portal/src/app/[eventSlug]/qa/page.tsx` - Shows banner if intake not completed

### Database:
- `attendee_intakes` table stores signals data
- `skipped` field tracks if user explicitly skipped
- `intake_completed_at` field on `registrations` tracks completion

### Server Actions:
- `submitIntake()` - Saves signals data
- `skipIntake()` - Marks as skipped (no data saved)
- `getIntakeStatus()` - Checks if user completed or skipped

## Compliance Notes

✅ **Separate consent step** - Not bundled with registration
✅ **Explicit opt-in** - Clear "Share Signals" action required
✅ **Dismissible** - Users can decline without consequences
✅ **Transparent** - Explains data usage and scope
✅ **Voluntary** - No features gated behind it
✅ **Limited scope** - "Only used for this event"
✅ **No external sharing** - Clearly stated in UI

This architecture ensures compliance with data privacy best practices while maximizing voluntary participation.

