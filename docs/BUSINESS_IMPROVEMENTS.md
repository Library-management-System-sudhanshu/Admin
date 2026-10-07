# Business-focused next steps

These are recommendations inferred from the app's current workflows, not measured promises of growth. The refactor does not implement new business services.

| Priority | Improvement | Why it fits this app | Measure |
| --- | --- | --- | --- |
| 1 | Real historical revenue, renewals and occupancy trends | Some dashboard KPI badges and sparklines were hardcoded. Those have been removed in the proposed refactor; retain the API-backed charts and add server-calculated comparisons. | Collected revenue, collection rate, renewal rate, occupancy by branch/shift |
| 2 | Onboarding checklist and trial conversion funnel | You already have registration, workspace setup, SaaS trials and payments. Guide owners through their first branch, seats, admission and collection, and identify the step where trials stall. | Signup → setup → first admission → first payment → paid SaaS subscription |
| 3 | Observable renewal/reminder automation | The messaging page already advertises fee and renewal reminders. Add actual last-run/next-run status, delivery failures, configurable timings and renewal outcomes instead of relying only on static “Active” chips. Verify backend behavior before changing the claims. | Delivery rate, renewals after a reminder, unpaid fees recovered |
| 4 | Enquiry pipeline and seat waitlist | Admissions and seat availability already exist. Capture prospects when a shift is full, record preferred shifts, and assign follow-ups when seats become vacant. | Enquiry-to-admission conversion, waitlist conversion, time a seat remains vacant |
| 5 | Referral tracking | Attribute referred libraries/students and apply rewards only after a successful paid conversion. Start with traceable referral codes before a full rewards system. | Referred paid customers, reward cost, retained referred customers |

Start by measuring conversion and renewals before building multiple features at once. Funnel analysis is useful for understanding conversion between defined steps; [PostHog's funnel documentation](https://posthog.com/docs/product-analytics/funnels) describes this method. This is a measurement approach, not a requirement to purchase a particular analytics product.

Implementation references: [RTK Query cache invalidation](https://redux.js.org/toolkit/rtk-query/usage/automated-refetching), [loading versus background fetching](https://redux.js.org/toolkit/rtk-query/usage/queries), [accessible form labels](https://www.w3.org/WAI/tutorials/forms/labels/), and [reduced-motion support](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html).
