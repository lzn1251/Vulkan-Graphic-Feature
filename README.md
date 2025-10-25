# Vulkan Graphics Feature

This document uses the Vulkan framework of [SaschaWillems
](https://github.com/SaschaWillems/Vulkan) to implement graphics algorithms and is for personal learning only.


# Currently Implemented Algorithms

HBAO（Horizon-Based Ambient Occlusion）

**HBAO** is a high-quality screen-space ambient occlusion algorithm. Unlike traditional SSAO methods that rely on
sampling and suffer from noise and view-dependent artifacts, **HBAO** computes occlusion by analyzing the
*horizon angle*-the maximum elevation angle of occluders in multiple directions around each pixel.
