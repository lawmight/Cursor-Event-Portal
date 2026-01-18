# Render Deployment Fix

The build is failing because Render needs to be configured to build from the correct directory.

## Quick Fix in Render Dashboard

1. Go to: https://dashboard.render.com/web/srv-d5jk86d6ubrc7390trc0/settings
2. Scroll to **Build & Deploy** section
3. Set **Root Directory** to: (leave empty or set to `.` since portal is the repo root)
4. Ensure **Build Command** is: `npm install && npm run build`
5. Ensure **Start Command** is: `npm start`
6. Click **Save Changes**
7. This will trigger a new deployment

## Alternative: If portal is a subdirectory

If the GitHub repo has `portal/` as a subdirectory (not the root), then:
1. Set **Root Directory** to: `portal`
2. Save and redeploy

The build should now succeed!

