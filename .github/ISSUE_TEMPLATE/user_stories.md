---
name: User Stories
about: Use this template for user stories submission
title: "C3 Phase 1: User Stories"
labels: []
assignees: ""
---

## Frontend Selection

We plan to build a Web frontend. It will contain a search box, dropdown menus and button for various user inputs. The
results will be displayed under the search panel. Currently, we are not exactly sure if there is any external 
libraries/packages/frameworks we are gonna use, but we might use some when we start implementing.


## User Stories + DoDs  
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! For the DoDs, think about both success and failure scenarios. You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-22w2/project/checkpoint-3).

### User Story 1

As a UBC student, I want to be able to search for the average score of some courses, so I can decide whether I want to
take them.

#### Definitions of Done(s)

Scenario 1: Search for the average of an existing course \
Given: The user is on the course search page \
When: The user enters the course name, select "Average", and clicks the “Search” button \
Then: The application displays the average score of that course


Scenario 2: Search for the average of a non-existing course \
Given: The user is on the course search page \
When: The user enters a course name that does not exist in the system, select "Average", and clicks “Search” \
Then: The application displays a message indicating that no results were found, and suggests the user to try a correct
course name.

### User Story 2

As a UBC staff member, I want to be able to see the rooms that have enough seats to accommodate my event, so I can book
a suitable one.

#### Definitions of Done(s)

Scenario 1: Find rooms with appropriate number of seats \
Given: The user is on the room page \
When: The user enters a number for the seats, and clicks the “Search” button \
Then: The application displays a list of rooms with the number of seats that is larger than the user enters.

Scenario 2: Find rooms with a large number of seats \
Given: The user is on the room page \
When: The user enters a large number for the seats, and clicks the “Search” button \
Then: The application displays a message indicating that no room is large enough to fit all the seats, and suggests the user to try a different number.

### Others

You may provide any additional user stories + DoDs in this section for general TA feedback.

But these will not be graded.
