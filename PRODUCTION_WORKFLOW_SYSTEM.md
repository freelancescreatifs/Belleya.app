# Production Workflow System - Complete Implementation

## Overview
A complete, intelligent, and automated production workflow system has been implemented in Belleya Studio. The system is fully synchronized between Day View, Agenda, Tasks, and the Database.

---

## 🎯 Production Steps Structure

Each content post has **4 production steps**:

1. **Script** - Writing and planning the content
2. **Tournage** - Shooting/capturing the content
3. **Montage** - Editing the content
4. **Planifié** - Scheduled for publication

**IMPORTANT:** "Publié" (Published) is NOT a checkbox in the UI. It exists only as:
- A database status field (`is_published_status`)
- A visual status tag

---

## ✅ Checkbox Logic

### Basic Rules
- Checking "Script" → only Script is checked
- Unchecking "Script" → Script becomes unchecked

### Cascading Forward
- Checking "Planifié" → **automatically checks** Script, Tournage, Montage
- This means: "Content is ready for publication"

### Cascading Backward
- Unchecking ANY step before "Planifié" → **automatically unchecks** Planifié
- Unchecking "Script" → unchecks Tournage, Montage, Planifié
- Unchecking "Tournage" → unchecks Montage, Planifié
- Unchecking "Montage" → unchecks Planifié

### Full Completion
- When ALL steps are checked → `is_fully_produced` = true
- Internally, "Publié" is considered checked
- **BUT** the visible status tag depends on publication date

---

## 🏷️ Status Tag Logic (CRITICAL)

The status tag shown to the user follows **date-based logic**:

### Scenario 1: All Steps Checked + Future Date
```
✅ Script checked
✅ Tournage checked
✅ Montage checked
✅ Planifié checked
📅 Publication date: Tomorrow

→ Status Tag: "Non publié"
```

### Scenario 2: All Steps Checked + Past Date/Time
```
✅ Script checked
✅ Tournage checked
✅ Montage checked
✅ Planifié checked
📅 Publication date: Yesterday

→ Status Tag: "Publié" ✅
```

### Scenario 3: Not All Steps Checked
```
✅ Script checked
❌ Tournage not checked
❌ Montage not checked
❌ Planifié not checked
📅 Publication date: Any date

→ Status Tag: "Non publié"
```

### Real-Time Updates
- The status tag **automatically updates** every minute
- When publication date/time passes, tag changes from "Non publié" to "Publié"
- No manual action needed

---

## 📅 Production Dates System

### With Production Dates
When creating content with production dates defined:
- Each step has its own date and time
- Steps appear in Day View (expanded section)
- Steps appear in Tasks
- Steps appear in Agenda
- Dates show under each production step

### Without Production Dates
When creating content WITHOUT production dates:
- Production steps DO NOT appear in Day View
- No production tasks are generated
- Only publication date exists
- When publication date passes → tag automatically becomes "Publié"

### Important
- **Production dates NEVER auto-change**
- They remain fixed as originally set
- Only the "En retard" (Late) indicator appears if needed

---

## ⏰ Late/Retard System

A step becomes "**En retard**" (Late) when:
```
Current date/time > Production step date/time
AND
Step is NOT checked
```

### Example
```
📅 Script date: January 5, 2025 at 10:00
📆 Today: January 6, 2025 at 14:00
❌ Script not checked

→ Display: "En retard" badge in red
```

### Visual Indicators
- Late steps show with red background
- "En retard" badge appears
- Original production date remains unchanged
- Late indicator disappears when step is checked

---

## 🔄 Synchronization System

### Checkbox → Task Sync
```
When checkbox is CHECKED:
→ Corresponding task marked as completed
→ Task remains visible but shown as done
→ last_completed_date is set

When checkbox is UNCHECKED:
→ Task marked as not completed
→ Task appears in active task lists
→ last_completed_date is cleared
```

### Database Triggers
All synchronization happens automatically via database triggers:
1. `trigger_checkbox_cascade` - Handles cascading checkbox logic
2. `trigger_calculate_published_status` - Updates published status
3. `trigger_sync_checkboxes_to_tasks` - Syncs checkboxes with tasks

### Post Deletion
When a post is deleted:
- ALL production steps deleted
- Removed from Agenda
- Removed from Tasks
- Removed from Database
- **No orphan tasks remain**

---

## 📆 Agenda View

### Displayed Content
The Agenda shows:
- **Upcoming posts** (future publication dates)
- **Published posts** (past publication dates)
- **Production tasks** (for steps with dates)

### Pink Publication Tag
- Publication date appears as a **PINK TAG** 🌸
- Shows for both future AND past posts
- Format: "Publication: DD/MM/YYYY à HH:MM"
- Visually distinct from production steps

### Color Coding
- 🟢 **Green** - Completed steps
- 🔴 **Red** - Late steps
- ⚪ **Gray** - Pending steps
- 🌸 **Pink** - Publication date

---

## 💾 Database Structure

### New Columns in `content_calendar`
```sql
script_checked      boolean  DEFAULT false
tournage_checked    boolean  DEFAULT false
montage_checked     boolean  DEFAULT false
planifie_checked    boolean  DEFAULT false
is_fully_produced   boolean  COMPUTED (all checkboxes checked)
is_published_status text     COMPUTED (based on date logic)
```

### Automatic Computation
- `is_fully_produced` is a generated column
- `is_published_status` is auto-calculated by triggers
- User NEVER manually sets these fields

---

## 🎨 UI Components

### ProductionStepsCheckboxes Component
Located: `src/components/content/ProductionStepsCheckboxes.tsx`

Features:
- ✅ Checkbox interaction
- ⏰ Late detection
- 📅 Date display
- 🎨 Compact or full view modes

### PublishedStatusTag Component
Located: `src/components/content/PublishedStatusTag.tsx`

Features:
- ✅ Real-time status updates
- 📅 Date-based logic
- 🔄 Auto-refresh every minute
- 🎨 Green (Published) / Gray (Not Published)

---

## 📍 Where to Find Features

### Day View
Location: Content → Calendrier éditorial → Jour

Features:
- Click on a content to expand
- See all production checkboxes
- View dates under each step
- See "En retard" indicators
- Real-time status tag

### Instagram Feed View
Location: Content → Vue Feed Instagram

Features:
- Compact checkbox display
- Published status tag
- Drag and drop ordering

### Table View
Location: Content → Studio de contenu

Features:
- Table overview of all content
- Quick filters
- Status tags
- Edit and delete actions

---

## ⚠️ Important Edge Cases

### Case 1: Check Everything, Future Date
```
Action: User checks all steps
Date: Tomorrow
Result: Tag shows "Non publié"
Reason: Publication date has not passed yet
```

### Case 2: Check Everything, Past Date
```
Action: User checks all steps
Date: Yesterday
Result: Tag auto-switches to "Publié"
Reason: Publication date has passed
```

### Case 3: Check Planifié Directly
```
Action: User checks Planifié checkbox
Result: Script, Tournage, Montage auto-check
Reason: Cascading forward logic
```

### Case 4: Uncheck Script
```
Action: User unchecks Script
Result: Tournage, Montage, Planifié auto-uncheck
Result: Status becomes "Non publié"
Reason: Cascading backward logic
```

### Case 5: No Production Dates
```
Situation: Post created without production dates
Visible: Only publication date exists
Result: No checkboxes shown in Day View
Behavior: When publication date passes → auto "Publié"
```

### Case 6: Delete Post
```
Action: User deletes a post
Result: Post removed everywhere
Result: All production tasks deleted
Result: No orphan data remains
```

---

## 🔧 Technical Implementation

### Database Migration
File: `supabase/migrations/[timestamp]_create_production_checkboxes_system.sql`

Creates:
- New checkbox columns
- Computed columns
- Triggers for cascading logic
- Triggers for status calculation
- Triggers for task synchronization
- Helper functions

### Frontend Components
1. **ProductionStepsCheckboxes.tsx** - Checkbox UI
2. **PublishedStatusTag.tsx** - Status tag with real-time updates
3. **EditorialCalendar.tsx** - Updated Day View
4. **ContentForm.tsx** - Updated interfaces

### Key Functions
- `calculate_published_status()` - Auto-calculates published status
- `handle_checkbox_cascade()` - Handles cascading logic
- `sync_production_checkboxes_to_tasks()` - Syncs with tasks
- `is_production_step_late()` - Detects late steps

---

## ✨ User Experience

The system is designed to feel **intelligent and automatic**:

✅ **Automatic Status Updates**
- No manual "mark as published" button
- Status updates based on real date/time
- Refreshes every minute

✅ **Smart Cascading**
- Check "Planifié" → everything before auto-checks
- Uncheck any step → future steps auto-uncheck

✅ **Visual Clarity**
- Green = Done
- Red = Late
- Gray = Pending
- Pink = Publication

✅ **Zero Orphans**
- Delete a post → everything cleaned up
- No leftover tasks or data

✅ **Flexible Workflow**
- With production dates → detailed tracking
- Without production dates → simple publication

---

## 🎯 Summary

This production workflow system provides:
1. ✅ Complete checkbox logic with cascading
2. 📅 Date-reactive status tags
3. ⏰ Automatic late detection
4. 🔄 Full synchronization (Day View, Agenda, Tasks, DB)
5. 🎨 Clean, intuitive UI
6. 🚀 Intelligent automation

**The system feels intelligent because it is.**

Users don't need to think about the technical details - the system handles everything automatically while remaining predictable and clear.
