# Vulkan Graphics Feature

This document uses the Vulkan framework of [SaschaWillems
](https://github.com/SaschaWillems/Vulkan) to implement graphics algorithms and is for personal learning only.

Note: Currently， this project only supports glsl.


# Currently Implemented Algorithms

HBAO（Horizon-Based Ambient Occlusion）

**HBAO** is a high-quality screen-space ambient occlusion algorithm. Unlike traditional SSAO methods that rely on
sampling and suffer from noise and view-dependent artifacts, **HBAO** computes occlusion by analyzing the
*horizon angle*-the maximum elevation angle of occluders in multiple directions around each pixel.


GTAO（Ground-Truth Ambient Occlusion）

**GTAO** is an advanced screen-space ambient occlusion technique that aims to provide more accurate and realistic ambient lighting effects compared to traditional SSAO methods. Unlike simpler screen-space AO algorithms that use random sampling or horizon-based approaches, **GTAO** employs a more sophisticated approach to calculate ambient occlusion by tracing rays in multiple directions around each pixel and considering the geometric information from the G-Buffer.