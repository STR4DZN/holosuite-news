# Separate Master data from Published projections

HoloNews stores GM-only Master data in a JournalEntry that players cannot receive. Publishing builds sanitized JournalEntry projections with Foundry ownership for each audience. The Reader never queries the Master store. This duplicates published content, but it prevents drafts, notes, future content, rules, audit history, and Table reads from reaching a player client.
