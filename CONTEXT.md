# HoloNews

HoloNews models the editorial lifecycle of in-world news and the distinct experience of the people who publish it and read it.

## Language

**Publication**:
An in-world news brand with its own identity, theme, and archive.
_Avoid_: Newspaper, channel, outlet

**Issue**:
A dated release of a Publication that groups pages and articles under one lifecycle.
_Avoid_: Edition, release

**Article**:
A reusable news story with narrative views, visibility rules, and editorial metadata.
_Avoid_: News item, post, entry

**Page**:
An ordered layout inside an Issue that arranges editorial blocks.
_Avoid_: Screen, route

**Narrative views**:
The fictional audience number that the GM sets and readers can see.
_Avoid_: Views, hits, reader count

**Table reads**:
The private record of players who opened an Article at the table.
_Avoid_: Actual views, telemetry count

**Master data**:
The GM-only editorial source that includes drafts, notes, schedules, audit history, and Table reads.
_Avoid_: Database, admin data

**Published projection**:
The sanitized, user-specific data that a reader is allowed to receive.
_Avoid_: Public database, cache

**Reader state**:
A player's local set of read Article IDs and Issue IDs.
_Avoid_: Read tracking, Table reads

**Editorial Manager**:
The GM-only application used to create, organize, preview, and publish content.
_Avoid_: Admin panel, editor

**Reader**:
The player application that navigates only Published projections.
_Avoid_: Viewer, player mode
