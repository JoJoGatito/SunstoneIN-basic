# Group Pages Template Update Plan

## Overview
Apply the improved events section template from the youth group page to all other group pages to ensure consistency and better organization across the site.

## Source Template
The improved template from `sunstone-youth-group.html` includes:
- Structured event information with location field
- Template comments for adding new events
- Consistent styling and spacing
- Better organized event card layout

## Files to Update
1. groups/cafeteria-collective.html
2. groups/rock-and-stone.html
3. groups/disabitch.html
4. groups/poc-group.html
5. groups/haus-of-sol.html

## Implementation Steps

### 1. Event Section Structure
Update each page's event section to include:
```html
<!-- 
  UPCOMING EVENTS SECTION
  
  To add a new event:
  1. Copy the event template below
  2. Update the following information:
     - Title: Update the text inside the h3 tags
     - Date: Update the date span
     - Time: Update the time span
     - Location: Update the location span
     - Description: Update the text in the p tag
  3. Place newest events at the top
  
  Note: Keep the mb-6 class on all events except the last one
-->
```

### 2. Event Card Template
Implement the improved event card structure:
```html
<div class="bg-gray-900 p-6 rounded-lg mb-6">
  <h3 class="text-xl font-bold text-yellow-500 mb-2">
    [Event Title]
  </h3>
  
  <div class="flex items-center mb-3">
    <i class="far fa-calendar text-yellow-500 mr-2"></i>
    <span>[Date]</span>
    <i class="far fa-clock text-yellow-500 ml-4 mr-2"></i>
    <span>[Time]</span>
  </div>
  
  <div class="flex items-center mb-3">
    <i class="fas fa-map-marker-alt text-yellow-500 mr-2"></i>
    <span>[Location]</span>
  </div>
  
  <p class="text-gray-300">
    [Event Description]
  </p>
</div>
```

## Implementation Strategy
1. Use Orchestrator mode to:
   - Create subtasks for each group page
   - Delegate to Code mode for implementing changes
   - Verify changes are consistent across all pages

2. For each page:
   - Update the events section structure
   - Add template comments
   - Implement improved event card layout
   - Ensure consistent spacing and styling
   - Preserve existing event data where available

## Success Criteria
- All group pages have consistent event section structure
- Template comments are present in all files
- Event cards include all required fields (title, date, time, location, description)
- Styling and spacing is consistent across all pages