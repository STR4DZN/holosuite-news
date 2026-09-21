# Keep HoloSuite integration at the registration seam

HoloSuite Core owns discovery, launcher visibility, and the open callback. HoloNews owns storage, permissions, publication, sockets, and applications. HoloNews registers one `playerVisible` tile through `registerApp`, listens for `holosuite-core.apiReady`, and does not patch the Core DOM or badge implementation.
