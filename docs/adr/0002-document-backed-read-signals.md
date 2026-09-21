# Derive Table-read identity from a Foundry document update

Raw module socket payloads do not provide a trustworthy caller identity. A player therefore writes an `articleOpened` signal only to their own User flag. Foundry authorizes that document update, and the primary active GM derives the reader from the updated User document. The socket event only asks the GM to scan pending signals and never establishes identity.
