# Siloq Development Roadmap

> Last Updated: November 16, 2024
> **Current Status**: Core features complete, ready for enhancement phase

NOTE:
Always reference the `Ledgerly` repository at "/Users/landonspell/dev/projects/ledgerly" first to see what has already been created or implemented before creating a new instance.

---

## 🎉 Recently Completed Features

### Core Application (100% Complete)

- ✅ **Project Setup**: Expo + TypeScript + Supabase + React Native
- ✅ **Authentication**: Login, Signup, Session management
- ✅ **Navigation**: Tab-based navigation (Dashboard, Invoices, Expenses, More)
- ✅ **Database**: Complete schema with RLS policies
- ✅ **Theme**: Siloq design system (Blue #2F6D92, Mint #63D1C5)

### Invoice Management (100% Complete)

- ✅ Invoice list with filters (All, Outstanding, Paid)
- ✅ Year grouping with totals
- ✅ Create/Edit invoice form with validation
- ✅ Client selector
- ✅ Line items with auto-calculation
- ✅ Search functionality
- ✅ Pull-to-refresh
- ✅ FAB for new invoice
- ✅ Native date pickers

### Estimates (100% Complete)

- ✅ Estimates list with tabs (All, Pending, Accepted, Declined)
- ✅ Year grouping with totals
- ✅ Create/Edit estimate form
- ✅ Search functionality
- ✅ Pull-to-refresh
- ✅ Conversion tracking

### Expenses (100% Complete)

- ✅ Expenses list grouped by month
- ✅ Create/Edit expense form
- ✅ Category selection
- ✅ Tax deductibility toggle
- ✅ Search functionality
- ✅ Pull-to-refresh

### Mileage Tracking (100% Complete)

- ✅ Mileage list grouped by month
- ✅ Tabs (All, Business, Personal)
- ✅ Create/Edit mileage form
- ✅ Auto-calculate IRS deduction ($0.67/mile)
- ✅ Business/Personal toggle
- ✅ Search functionality
- ✅ Detail view with share/delete

### Dashboard (100% Complete)

- ✅ This Month stats (Income, Expenses, Net Profit)
- ✅ Pending invoices count
- ✅ Quick actions (New Invoice, Estimate, Expense, Mileage)
- ✅ Recent activity feed
- ✅ Pull-to-refresh with haptics
- ✅ Profile button navigation

### Settings (100% Complete)

- ✅ **Account Settings**: Profile, phone, email
- ✅ **Business Settings**: Business info, invoice defaults, tax ID
- ✅ **App Settings**: Theme, currency, notifications

### Reports & Analytics (100% Complete)

- ✅ **Reports Dashboard**:
  - Time period selector (This Month, Last Month, This Year, All Time)
  - Income/Expenses/Profit metrics
  - Top clients by revenue
  - Expenses by category
- ✅ **Tax Report**:
  - Tax year selector
  - Business income/expenses summary
  - Mileage deduction calculator
  - Income by month breakdown
  - Deductible expenses by category

### UX Enhancements (100% Complete)

- ✅ Inline form validation with error messages
- ✅ Error boundaries for crash handling
- ✅ Search across all list screens
- ✅ Native date pickers (@react-native-community/datetimepicker)
- ✅ Pull-to-refresh haptic feedback
- ✅ Loading states
- ✅ Empty states
- ✅ App icons and branding

---

## 🚀 Phase 1: High Priority Quick Wins

_Features providing immediate value with moderate effort_

### 1.1 Invoice PDF Generation ⭐ **IN PROGRESS**

- [x] Install expo-print and expo-sharing
- [x] Create professional invoice PDF template
- [x] Add "Download PDF" button to invoice detail
- [x] Add "Share PDF" functionality
- [x] Include business branding in PDF
- [ ] **TODO**: Revisit PDF layout to better match Ledgerly design (improve table styling, spacing, and overall polish)
- **Why**: Essential for professional invoicing workflow
- **Effort**: Medium (2-3 days)
- **Dependencies**: None

### 1.2 Email Invoice Functionality ⭐ **TOP PRIORITY**

- [ ] Integrate email service (SendGrid/AWS SES or Supabase Edge Functions) - Please use Resend for the email service.
- [ ] Create email invoice template (HTML)
- [ ] Add "Send via Email" button
- [ ] Track sent status
- [ ] Email delivery confirmation
- **Why**: Critical for client communication
- **Effort**: Medium (2-3 days)
- **Dependencies**: PDF generation

### 1.3 Payment Recording ⭐ **COMPLETED**

- [x] Add "Record Payment" button on invoice detail
- [x] Payment form: amount, date, method, reference
- [x] Update invoice status (partial/paid)
- [x] Track payment history per invoice
- [x] Show outstanding balance
- [x] Display payment history section on invoice detail
- [x] Add 'partial' status to database and UI
- [x] Created payments table with full RLS
- [x] Auto-calculate balance due and update status
- **Why**: Complete invoice lifecycle
- **Effort**: Low (1-2 days)
- **Dependencies**: None

### 1.4 Invoice Actions

- [ ] Duplicate invoice functionality
- [ ] Delete invoice with confirmation
- [ ] Mark as paid quick action
- [ ] Convert estimate to invoice
- **Why**: Improves workflow efficiency
- **Effort**: Low (1 day)
- **Dependencies**: None

### 1.5 Client Management

- [ ] Clients list screen with search
- [ ] Client detail screen (contact info, invoice history)
- [ ] Create/Edit client form
- [ ] "New Invoice for Client" quick action
- [ ] Client total billed display
- **Why**: Better client relationship management
- **Effort**: Medium (2-3 days)
- **Dependencies**: None

### 1.6 Default Values from Business Settings

- [ ] Auto-populate "From" fields in invoices
- [ ] Use default payment terms
- [ ] Use default tax rate
- [ ] Use default invoice notes
- **Why**: Reduces repetitive data entry
- **Effort**: Low (1 day)
- **Dependencies**: Business settings (already complete)

### 1.7 Receipt Camera Integration

- [ ] Add camera button to expense form
- [ ] Capture receipt photo with expo-image-picker
- [ ] Upload to Supabase storage
- [ ] Display receipt thumbnail in expense list
- [ ] Full-screen receipt viewer
- **Why**: Mobile-native convenience
- **Effort**: Low (1-2 days)
- **Dependencies**: expo-image-picker (already installed)

### 1.8 Receipt AI Extraction

- [ ] Add AI capabilities to receipt capture to extract data and populate the expense form
- **Why**: Improves workflow efficiency
- **Effort**: Medium (3-4 days)
- **Dependencies**: Unknown

### 1.9 Invoice Reload

- [ ] When an invoice is deleted and the user is take back to `/invoices`, reload/refresh the page so that the deleted invoice doesn't display anymore.
- [ ] When an invoice is created and the user is take back to `/invoices`, reload/refresh the page so that the created invoice renders in the list.

---

## 🎯 Phase 2: Core Business Features

_Essential features for a complete invoicing solution_

### 2.1 Recurring Invoices

- [ ] Create recurring invoice template
- [ ] Schedule frequency (weekly, monthly, yearly)
- [ ] Auto-generate invoices on schedule
- [ ] Notification when invoice is generated
- [ ] Edit/pause/cancel recurring invoice
- **Why**: Essential for subscription businesses
- **Effort**: High (1-2 weeks)
- **Dependencies**: Background jobs, notifications

### 2.2 Invoice Templates & Customization

- [ ] Multiple invoice template styles
- [ ] Logo upload and placement
- [ ] Custom color schemes
- [ ] Custom fields
- [ ] Template selector
- **Why**: Professional branding
- **Effort**: High (1-2 weeks)
- **Dependencies**: PDF generation

### 2.3 Client Portal / Public Invoice View

- [ ] Public shareable invoice link (using share_token)
- [ ] View-only invoice page
- [ ] Payment instructions display
- [ ] Download PDF from public view
- [ ] Track when client views invoice
- **Why**: Professional client experience
- **Effort**: Medium (3-5 days)
- **Dependencies**: PDF generation

### 2.4 Late Fees & Payment Reminders

- [ ] Auto-calculate late fees based on settings
- [ ] Scheduled payment reminder emails
- [ ] Overdue notification system
- [ ] Customizable reminder templates
- [ ] Reminder frequency settings
- **Why**: Improves cash flow
- **Effort**: High (1-2 weeks)
- **Dependencies**: Email system, notifications

### 2.5 Partial Payments

- [ ] Track multiple payments per invoice
- [ ] Payment history view
- [ ] Automatic status updates (partial/paid)
- [ ] Outstanding balance calculation
- [ ] Payment reminders for partial payments
- **Why**: Common in B2B scenarios
- **Effort**: Medium (3-5 days)
- **Dependencies**: Payment recording

### 2.6 Line Item Library

- [ ] Saved line item templates
- [ ] Template categories
- [ ] Quick add from library
- [ ] Edit templates
- [ ] Default rate/description
- **Why**: Faster invoice creation
- **Effort**: Medium (3-5 days)
- **Dependencies**: None

### 2.7 Multi-Currency Support

- [ ] Currency selector in invoice/estimate
- [ ] Exchange rate API integration
- [ ] Multi-currency reporting
- [ ] Currency conversion display
- [ ] Default currency in settings
- **Why**: International business support
- **Effort**: High (1-2 weeks)
- **Dependencies**: Currency API

### 2.8 Time Tracking

- [ ] Time entry form (project, task, hours, rate)
- [ ] Timer functionality
- [ ] Time entries list
- [ ] Convert time to invoice line items
- [ ] Billable/non-billable toggle
- **Why**: Essential for service businesses
- **Effort**: High (1-2 weeks)
- **Dependencies**: None

---

## 💎 Phase 3: Advanced Features & Polish

_Enhanced capabilities and professional refinements_

### 3.1 Advanced Dashboard

- [ ] Income vs Expenses chart (bar/line)
- [ ] Monthly trends visualization
- [ ] Customizable dashboard widgets
- [ ] KPI tracking
- [ ] Goal setting and progress
- **Why**: Better business insights
- **Effort**: Medium (1 week)
- **Dependencies**: Chart library

### 3.2 Dark Mode

- [ ] Dark color palette
- [ ] Theme toggle in settings
- [ ] System theme sync
- [ ] Persist theme preference
- [ ] Update all screens for dark mode
- **Why**: User preference, modern UX
- **Effort**: Medium (3-5 days)
- **Dependencies**: Theme system refactor

### 3.3 Batch Operations

- [ ] Multi-select in list views
- [ ] Bulk send invoices
- [ ] Bulk delete
- [ ] Bulk export
- [ ] Bulk status change
- **Why**: Efficiency for high volume
- **Effort**: Medium (3-5 days)
- **Dependencies**: None

### 3.4 Invoice Versioning

- [ ] Save invoice versions/revisions
- [ ] Version history view
- [ ] Restore previous version
- [ ] Compare versions
- [ ] Track changes
- **Why**: Audit trail, dispute resolution
- **Effort**: Medium (3-5 days)
- **Dependencies**: Versions table

### 3.5 Client Statements

- [ ] Generate account statement
- [ ] Date range selector
- [ ] Show all invoices, payments, balance
- [ ] PDF export
- [ ] Email statement
- **Why**: Professional communication
- **Effort**: Medium (1 week)
- **Dependencies**: PDF generation

### 3.6 Expense Categorization & Tags

- [ ] Custom expense categories
- [ ] Multi-tag system
- [ ] Tag filtering
- [ ] Category-based reports
- [ ] Tag-based budgets
- **Why**: Better expense organization
- **Effort**: Low (2-3 days)
- **Dependencies**: None

### 3.7 Budget Tracking

- [ ] Set budget by category
- [ ] Track spending vs budget
- [ ] Budget alerts
- [ ] Monthly budget reset
- [ ] Budget reports
- **Why**: Financial control
- **Effort**: Medium (3-5 days)
- **Dependencies**: Expense categories

### 3.8 Onboarding Flow

- [ ] Welcome screens
- [ ] Setup wizard (business info, first invoice)
- [ ] Feature highlights
- [ ] Skip/complete tracking
- [ ] Contextual help tips
- **Why**: Better first-time user experience
- **Effort**: Low (2-3 days)
- **Dependencies**: None

---

## 🔗 Phase 4: Integrations & Scale

_External connections and advanced capabilities_

### 4.1 Payment Gateway Integration ⭐ **HIGH VALUE**

- [ ] Stripe integration
- [ ] PayPal integration
- [ ] Payment links in invoices
- [ ] Track online payments
- [ ] Payment webhook handling
- **Why**: Faster payment collection
- **Effort**: High (2-3 weeks)
- **Dependencies**: Stripe/PayPal accounts

### 4.2 Receipt OCR / Scanning

- [ ] Photo to expense data extraction
- [ ] Google Vision or AWS Textract integration
- [ ] Auto-fill expense form from receipt
- [ ] Confidence scoring
- [ ] Manual correction interface
- **Why**: Reduces manual entry
- **Effort**: High (1-2 weeks)
- **Dependencies**: OCR service API

### 4.3 Cloud Backup Integration

- [ ] Google Drive backup
- [ ] Dropbox backup
- [ ] iCloud backup (iOS)
- [ ] Scheduled automatic backups
- [ ] Restore from backup
- **Why**: Data security
- **Effort**: Medium (1 week)
- **Dependencies**: Cloud SDKs

### 4.4 Accounting Software Integration

- [ ] QuickBooks export
- [ ] Xero export
- [ ] CSV export format
- [ ] Mapping configuration
- [ ] Sync status tracking
- **Why**: Professional accounting workflow
- **Effort**: High (2-3 weeks per integration)
- **Dependencies**: Third-party APIs

### 4.5 GPS Mileage Tracking

- [ ] Auto-track trips with GPS
- [ ] Background location tracking
- [ ] Start/stop trip manually
- [ ] Auto-detect business trips
- [ ] Route visualization
- **Why**: Accurate automated logging
- **Effort**: High (1-2 weeks)
- **Dependencies**: expo-location, permissions

### 4.6 Push Notifications

- [ ] Payment received alerts
- [ ] Invoice overdue notifications
- [ ] Daily summary notifications
- [ ] Notification preferences
- [ ] Badge count updates
- **Why**: Timely business updates
- **Effort**: Medium (1 week)
- **Dependencies**: expo-notifications, backend

### 4.7 Biometric Authentication

- [ ] Face ID / Touch ID login
- [ ] Biometric settings
- [ ] Fallback to PIN
- [ ] Security preferences
- **Why**: Security + convenience
- **Effort**: Low (1-2 days)
- **Dependencies**: expo-local-authentication

### 4.8 QR Code Invoices

- [ ] Generate QR code for invoice
- [ ] QR code for payment
- [ ] Scan to view invoice
- [ ] Payment info in QR
- **Why**: Modern payment convenience
- **Effort**: Low (1 day)
- **Dependencies**: QR library

---

## 🏗️ Phase 5: Technical Improvements

_Performance, reliability, and code quality_

### 5.1 React Query Integration

- [ ] Replace Supabase calls with React Query
- [ ] Implement caching strategy
- [ ] Optimistic updates
- [ ] Background refetching
- [ ] Better loading/error states
- **Why**: Better UX and performance
- **Effort**: Medium (1 week)
- **Dependencies**: @tanstack/react-query

### 5.2 Offline Mode

- [ ] Local database with WatermelonDB
- [ ] Sync queue
- [ ] Conflict resolution
- [ ] Offline indicator
- [ ] Retry failed syncs
- **Why**: Mobile reliability
- **Effort**: High (2-3 weeks)
- **Dependencies**: WatermelonDB or similar

### 5.3 Automated Testing

- [ ] Unit tests for utilities
- [ ] Component tests
- [ ] Integration tests
- [ ] E2E tests with Detox
- [ ] CI/CD pipeline
- **Why**: Code quality and confidence
- **Effort**: High (ongoing)
- **Dependencies**: Jest, Detox

### 5.4 Performance Monitoring

- [ ] Sentry error tracking
- [ ] Performance metrics
- [ ] Crash reporting
- [ ] User session replay
- [ ] Alert configuration
- **Why**: Production reliability
- **Effort**: Low (2-3 days)
- **Dependencies**: Sentry account

### 5.5 Skeleton Loaders

- [ ] Replace loading spinners
- [ ] Content-aware skeletons
- [ ] Smooth transitions
- [ ] Match actual content layout
- **Why**: Better perceived performance
- **Effort**: Low (2-3 days)
- **Dependencies**: None

### 5.6 Animations & Transitions

- [ ] Screen transitions
- [ ] List animations
- [ ] Button feedback
- [ ] Form interactions
- [ ] Micro-interactions
- **Why**: Premium feel
- **Effort**: Medium (1 week)
- **Dependencies**: react-native-reanimated

---

## 🚢 Phase 6: Deployment & Distribution

_Prepare for app store release_

### 6.1 App Store Assets

- [ ] iOS screenshots (all device sizes)
- [ ] Android screenshots
- [ ] App preview videos
- [ ] Feature graphics
- [ ] App Store description
- [ ] Keywords and metadata
- **Why**: Required for publishing
- **Effort**: Medium (3-5 days)
- **Dependencies**: Final app ready

### 6.2 Legal & Compliance

- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR compliance tools
- [ ] Data export functionality
- [ ] Account deletion
- **Why**: Legal requirements
- **Effort**: Low (1-2 days)
- **Dependencies**: Legal review

### 6.3 Production Builds

- [ ] Configure EAS Build
- [ ] iOS production build
- [ ] Android production build
- [ ] App signing
- [ ] Version management
- **Why**: Deploy to users
- **Effort**: Low (1 day)
- **Dependencies**: EAS account

### 6.4 App Store Submissions

- [ ] Apple App Store submission
- [ ] Google Play Store submission
- [ ] App review preparation
- [ ] Beta testing (TestFlight, Internal Testing)
- **Why**: Public release
- **Effort**: Medium (review time varies)
- **Dependencies**: Production builds

---

## 📊 Priority Matrix

### ✅ Completed

1. ✅ Invoice PDF Generation (needs polish)
2. ✅ Payment Recording (fully complete)

### This Week (Immediate Focus)

3. ⭐ Email Invoice Functionality
4. ⭐ Client Management
5. ⭐ Invoice Actions (duplicate, delete, convert)

### Next 2 Weeks

6. Default Values from Business Settings
7. Receipt Camera Integration
8. Receipt AI Extraction

### This Month

8. Recurring Invoices
9. Invoice Templates
10. Client Portal
11. Dark Mode

### Next Quarter

- Payment Gateway Integration
- Time Tracking
- Multi-Currency
- Advanced Analytics
- Mobile-specific features

---

## 🎯 Success Metrics

**Short Term (1 month)**

- [ ] Users can create, send, and track invoices end-to-end
- [ ] PDF and email delivery working
- [ ] Payment recording functional
- [ ] Client management complete

**Medium Term (3 months)**

- [ ] Recurring invoices live
- [ ] Payment gateway integrated
- [ ] Mobile app published to stores
- [ ] 100+ active users

**Long Term (6 months)**

- [ ] Full feature parity with Invoice Simple
- [ ] Advanced features (time tracking, multi-currency)
- [ ] 1000+ active users
- [ ] Revenue generating (subscriptions or payment processing)

---

## 📝 Notes

- **Focus**: Mobile-first (iOS/Android), web is secondary
- **UX**: Follow Invoice Simple patterns, Ledgerly design system
- **Architecture**: Maintain clean code, proper TypeScript types
- **Performance**: Offline-capable, fast, responsive
- **Security**: RLS policies, data encryption, secure payments

---

**Ready to start? Pick any task from Phase 1 and let's build it!** 🚀
