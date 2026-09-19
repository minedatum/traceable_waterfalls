# Leadership Demonstration Guide: eGRC Waterfall Scoping & Governance Auditor Prototype

## 1. How to Enable the Public Demo Link (Fix for "Page Not Found")

In Google AI Studio, public links require a one-click publish:

1. Look at the **top right corner of your Google AI Studio window** (next to Settings / Export / Deploy).
2. Click the **"Share"** button.
3. Toggle sharing to **Public / Anyone with the link** (or generate the public shared link).
4. Once you click **Share**, Google Cloud activates the shared URL:
   - **Public Shared URL**: `https://ais-pre-mv6eif5soz6fwz3w5b575n-51009748921.asia-east1.run.app`

> **Note**: Until you click the **"Share"** button in AI Studio, opening the `ais-pre-...` URL returns **"Page not found"** because the deployment has not been published yet.

---

## 2. Access URLs

| Mode | URL | Notes |
| :--- | :--- | :--- |
| **Direct Live App** | [https://ais-dev-mv6eif5soz6fwz3w5b575n-51009748921.asia-east1.run.app](https://ais-dev-mv6eif5soz6fwz3w5b575n-51009748921.asia-east1.run.app) | Opens in your browser immediately. Works directly in any browser tab where your account is signed in. |
| **Public Shared App (For Leadership)** | [https://ais-pre-mv6eif5soz6fwz3w5b575n-51009748921.asia-east1.run.app](https://ais-pre-mv6eif5soz6fwz3w5b575n-51009748921.asia-east1.run.app) | **Activated after clicking "Share"** in Google AI Studio. Anyone on your LAN can open this without signing in. |

---

## 2. Key Executive Talking Points

1. **Dual-Role Governance Alignment**:
   - Seamless handoff between **FRC Requirement Owners** (scoping rule formulation, business justification, email alerts) and **Analytics Execution Teams** (SQL execution, case reduction counts, certification).
2. **Deterministic Retention Waterfall**:
   - Dynamically calculates starting population down to final in-scope remediation cases, tracking excluded cases, unique accounts, and net working days saved.
3. **Audit Readiness & Compliance**:
   - Every action (rule addition, value update, email alert dispatch, sign-off) logs timestamped entries with actor identity and audit metadata.
4. **First-Time Clean Slate by Default**:
   - Starts at 0 steps to demonstrate real-time step formulation live in front of leadership.
   - Includes **"Load Sample Steps"** button to immediately display an end-to-end completed state if requested during the meeting.

---

## 3. Demonstration Script (5-Minute Walkthrough)

### Step 1: Open the Clean Slate
1. Open the **Shared App URL**.
2. Point out the zero-state onboarding card: *"Ready for First-Time Demonstration"*.
3. Note the role indicator in the top right: **FRC Owner (Sarah Jenkins)**.

### Step 2: Formulate a Requirement Row (FRC Owner)
1. Click **+ Add Requirement Waterfall Row (Step 1)**.
2. Select Category: `Starting Population` or `Exclusion`.
3. Enter Title (e.g., *Base Active Retail Accounts FY26*).
4. Enter Exclude / Include counts and working days estimate.
5. Click **Add Scoping Row to Waterfall**.
6. Show that the step is immediately created and an immutable audit log entry is recorded.

### Step 3: Switch to Analyst Workspace
1. In the top bar, switch role from **FRC Owner** to **Analyst (Alex Morgan)**.
2. Review the analyst workflow tabs:
   - **Waterfall Requirements Table**: View all steps formulated by FRC. For each row, the analyst clicks the prominent **Start Analytics** button to initiate analysis and trigger the automated email alert to all project parties (PM, Analyst, and FRC Owner). Once started, the row is unlocked for case/account counting, schedule drafting, and final submission.
   - **Complete Analytics Summary**: Population deduction funnel visualization, aggregate KPIs, and deliverable rollup metrics.
   - **Finalise and Submit Step**: Formal sign-off and review packet submission.

### Step 4: Show Completed Sample Workflow (Optional)
- In the top navigation bar, click **"Load Sample Steps"**.
- This populates 6 realistic enterprise waterfall stages (Mortgage, Wealth Management, Closed Accounts, In-Flight Remediations, etc.) with funnel charts and signed-off badges.

### Step 5: Reset for the Next Demonstration
- Click **"Reset Demo"** in the top navigation bar at any time to return the application back to a 100% clean slate.

---

## 4. Prototype Controls Reference

- **Demo Link**: Copies the shared prototype URL to your clipboard.
- **Reset Demo**: Wipes local state and restores the zero-step onboarding view.
- **Load Sample Steps**: Injects pre-configured enterprise demonstration data.
- **Audit Logs**: Opens real-time activity log showing system actions, timestamps, and actors.
- **New Tab**: Opens the prototype in a clean standalone browser window.
