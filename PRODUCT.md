# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TypeScript, Vite, Foundry VTT v13 ApplicationV2, Handlebars, and plain CSS. HoloSuite Core 1.0.12 or newer is a required module.

## Users

Game Masters operate an in-world editorial system during campaign preparation and play. Players open the same HoloSuite tile to read only the content authorized for their user.

## Product Purpose

HoloNews makes campaign news feel like a real publication while giving the GM a compact CMS. Success is the complete flow from creating a Publication to verifying a player's Table read without exposing drafts or administrative data.

## Positioning

HoloNews separates Master data from user-specific Published projections. Narrative views remain a GM-authored fiction, while Table reads remain private table telemetry.

## Operating Context

The Reader opens inside the HoloSuite launcher and must work from 320 px phone windows through desktop popouts. The Editorial Manager is a larger Foundry window for rapid issue creation and advanced page composition.

## Capabilities and Constraints

- HoloSuite Core provides discovery and launch. HoloNews owns all content and authority.
- The same tile opens the Editorial Manager for a GM and the Reader for a player.
- Players can request public state and report an Article open. They cannot mutate editorial content.
- HoloSuite Core has no generic external-app badge provider. HoloNews shows unread counts inside the Reader.
- Foundry VTT v13 is the validated target. The implementation keeps low-cost v12 and v14 compatibility seams.
- The module uses no raw administrative HTML or Master data in a player render.

## Brand Commitments

The technical ID is `holosuite-news`. The default visual name is HoloNews. The HoloSuite device shell frames a publication-specific editorial surface. The default publication theme is a warm, legible future broadsheet rather than a generic dashboard.

## Evidence on Hand

- Master planning document supplied on 2026-09-20.
- HoloSuite source commit `38b825e836ca837210875958b8afd3aa631a033d`.
- HoloSuite Core 1.0.12 registration interface and lifecycle verified from source.
- No final publication logo, campaign imagery, or release URLs were supplied. The module must not fabricate them.

## Product Principles

- A secret that a player must not discover never reaches that player's client.
- GM authority is enforced at every mutation seam.
- Reading takes three actions at most: open, choose, read.
- Publishing is explicit and produces a complete projection before readers are notified.
- The UI favors legibility and real state over decorative science-fiction effects.

## Accessibility & Inclusion

All flows support keyboard use, visible focus, text alternatives, reduced motion, high contrast, and user-controlled font scale. Reader copy targets a comfortable 65 to 75 character measure.
