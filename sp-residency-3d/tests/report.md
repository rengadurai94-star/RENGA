# Automated test report

Run: 2026-11-28T08:36:48.391Z against http://localhost:4173/

**38 / 38 checks passed.**

| Result | Check | Detail |
|---|---|---|
| ✅ PASS | Exactly 26 residences in the project data | 26 |
| ✅ PASS | Floor-wise distribution = 6/6/6/6 on 1st-4th + 2 on 5th (brochure pp.5, 15-21) | {"f1":6,"f2":6,"f3":6,"f4":6,"f5":2} |
| ✅ PASS | Unit mix = 4 BHK x1, 3 BHK x13, 2 BHK x12 (brochure p.5) | {"3 BHK":13,"2 BHK":12,"4 BHK":1} |
| ✅ PASS | Typical floor plan traced into 6 residences A-F |  |
| ✅ PASS | Seven levels represented (Stilt, 1st-5th, Terrace) | Terrace, 5th Floor, 4th Floor, 3rd Floor, 2nd Floor, 1st Floor, Stilt Floor |
| ✅ PASS | Cinematic intro is shown on first visit |  |
| ✅ PASS | Intro animation is running | t 0.035 -> 0.330 |
| ✅ PASS | Skip Intro works |  |
| ✅ PASS | 3D building scene is rendering |  |
| ✅ PASS | "Explore Building" opens the 3D explorer |  |
| ✅ PASS | Mouse-wheel scrolling moves between floors | steps 1 -> 2 (stilt -> f1) |
| ✅ PASS | Floor rail lists all 7 levels | 7 |
| ✅ PASS | Direct floor selection (3rd Floor) |  |
| ✅ PASS | Next floor button |  |
| ✅ PASS | Previous floor button |  |
| ✅ PASS | 3rd floor lists 6 residences | 6 |
| ✅ PASS | Hover on the 2D plan highlights the same residence (shared state) |  |
| ✅ PASS | Hovering a residence in 3D shows it (raycast hit) | 3D at 456,240 |
| ✅ PASS | 3D hover is mirrored on the 2D plan | unit-shape hover |
| ✅ PASS | Clicking a residence in 3D selects it and opens details |  |
| ✅ PASS | 3D selection is highlighted on the Floor Plans viewer | unit-shape selected |
| ✅ PASS | Reset building view |  |
| ✅ PASS | Type A details match the brochure (3 BHK, carpet 1500, UDS 578.87) | Type A · 3 BHK |
| ✅ PASS | Original unit floor plan opens full screen | 1329px wide |
| ✅ PASS | Type B details match the brochure (2 BHK, carpet 957, UDS 369.34) | Type B · 2 BHK |
| ✅ PASS | Type C details match the brochure (2 BHK, carpet 1003, UDS 387.08) | Type C · 2 BHK |
| ✅ PASS | Type D details match the brochure (3 BHK, carpet 1472, UDS 568.07) | Type D · 3 BHK |
| ✅ PASS | Type E details match the brochure (2 BHK, carpet 846, UDS 326.51) | Type E · 2 BHK |
| ✅ PASS | Type F details match the brochure (3 BHK, carpet 1486, UDS 573.47) | Type F · 3 BHK |
| ✅ PASS | 5th floor shows "layout not published" instead of an invented plan |  |
| ✅ PASS | Gallery opens the full-screen viewer |  |
| ✅ PASS | All original images load | 37 images, broken: none |
| ✅ PASS | Return visit skips the intro automatically (Replay intro available) |  |
| ✅ PASS | Mobile starts in performance mode |  |
| ✅ PASS | Mobile: tap a residence opens its details |  |
| ✅ PASS | Mobile: no horizontal overflow | 0px |
| ✅ PASS | Without WebGL the explorer still works on the original 2D plans |  |
| ✅ PASS | No console errors, page errors or failed requests |  |

Screenshots: `tests/screenshots/`. They are rendered by a software GPU here, so a real device will look sharper and run smoother.
