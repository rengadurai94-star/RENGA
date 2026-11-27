#!/usr/bin/env python3
"""
SP Residency - structured project information (Phase 1 output).

    python3 -I sp-residency/scripts/build_project_information.py --out sp-residency

Every value in BROCHURE below was transcribed from the 36-page brochure (text layer via pdftotext,
raster/outlined labels via tesseract OCR + visual verification of 300 dpi renders). Source pages are
recorded next to each block. Values computed here (decimal feet, room areas, totals) are written under
keys ending in `_derived` so they can never be mistaken for brochure figures.

Writes:
  analysis/project-information.json   - the structured project file
  3d/unit-geometry.json               - per-unit room list for 3D modelling
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

# --------------------------------------------------------------------------- units (pages 15-21)
UNITS = {
    "A": dict(bhk=3, page=16, carpet=1500, balcony=142.8, sbu=1764, uds=578.87, facing="East",
              building_entry="S", flat_entry="E", bedrooms_dir="NE / NW / SW", kitchen_dir="SE",
              bathrooms_dir="N / S", floors=[1, 2, 3, 4], position="South-west corner (west row, south end)",
              rooms=[("Bedroom-1", "12'", "12'"), ("Bedroom-2", "12'", "12'6\""), ("Bedroom-3", "14'", "12'4\""),
                     ("Bathroom (Bedroom-1)", "4'6\"", "8'"), ("Bathroom (Bedroom-2)", "4'6\"", "8'"),
                     ("Bathroom (Bedroom-3)", "4'6\"", "8'"), ("Hall (living + dining)", "28'4\"", "11'"),
                     ("Kitchen (incl. utility)", "10'", "12'4\""), ("Service", "4'6\"", "8'"),
                     ("Balcony (hall, west)", "7'1\"", "10'8\""), ("Balcony (Bedroom-3, south)", "10'6\"", "3'6\""),
                     ("Balcony (kitchen side, south)", "10'6\"", "3'6\"")]),
    "B": dict(bhk=2, page=17, carpet=957, balcony=68.3, sbu=1125, uds=369.34, facing="East",
              building_entry="S", flat_entry="E", bedrooms_dir="NE / SW", kitchen_dir="NW",
              bathrooms_dir="N / S", floors=[1, 2, 3, 4], position="West row, between Unit C and the staircase",
              rooms=[("Bedroom-1", "13'", "11'"), ("Bedroom-2", "11'", "11'"),
                     ("Bathroom (Bedroom-1)", "4'6\"", "8'"), ("Bathroom (Bedroom-2)", "4'6\"", "8'"),
                     ("Hall (living + dining)", "28'4\"", "10'7\""), ("Kitchen (incl. utility)", "13'", "7'"),
                     ("Service", "4'6\"", "7'2\""), ("Balcony (hall, west)", "7'1\"", "9'4\"")]),
    "C": dict(bhk=2, page=18, carpet=1003, balcony=23.6, sbu=1179, uds=387.08, facing="East",
              building_entry="S", flat_entry="E", bedrooms_dir="NW / SW", kitchen_dir="SE",
              bathrooms_dir="N / S", floors=[1, 2, 3, 4], position="North-west corner (west row, north end)",
              rooms=[("Bedroom-1", "13'", "11'5\""), ("Bedroom-2", "13'", "12'"),
                     ("Bathroom (Bedroom-1)", "4'6\"", "8'"), ("Bathroom (Bedroom-2)", "4'6\"", "8'"),
                     ("Hall (living + dining)", "16'", "18'8\""), ("Kitchen (incl. utility)", "11'6\"", "7'5\""),
                     ("Service", "4'6\"", "5'"), ("Balcony (Bedroom-1, north)", "7'3\"", "4'")]),
    "D": dict(bhk=3, page=19, carpet=1472, balcony=144.4, sbu=1731, uds=568.07, facing="West",
              building_entry="S", flat_entry="W", bedrooms_dir="NW / SW / NE", kitchen_dir="SE",
              bathrooms_dir="N / S", floors=[1, 2, 3, 4], position="North-east corner (east row, north end)",
              rooms=[("Bedroom-1", "12'", "11'5\""), ("Bedroom-2", "12'", "11'5\""), ("Bedroom-3", "13'", "14'"),
                     ("Bathroom (Bedroom-1)", "4'6\"", "8'"), ("Bathroom (Bedroom-2)", "4'6\"", "8'"),
                     ("Bathroom (Bedroom-3)", "4'6\"", "8'"), ("Hall (living + dining)", "28'4\"", "11'"),
                     ("Kitchen (incl. utility)", "10'", "12'"), ("Service", "4'6\"", "8'"),
                     ("Balcony (Bedroom-1, north)", "8'10\"", "4'"), ("Balcony (Bedroom-2, north)", "11'4\"", "4'"),
                     ("Balcony (hall, east)", "7'1\"", "11'")]),
    "E": dict(bhk=2, page=20, carpet=846, balcony=72.0, sbu=995, uds=326.51, facing="West",
              building_entry="S", flat_entry="W", bedrooms_dir="NE / SW", kitchen_dir="SE",
              bathrooms_dir="S", floors=[1, 2, 3, 4], position="East row, between Units D and F",
              rooms=[("Bedroom-1", "12'", "13'"), ("Bedroom-2", "10'", "11'3\""),
                     ("Bathroom 1", "4'6\"", "8'"), ("Bathroom 2", "4'6\"", "8'"),
                     ("Hall (living + dining)", "10'", "11'"), ("Kitchen (incl. utility)", "8'", "8'"),
                     ("Balcony (kitchen/dining, east)", "6'5\"", "12'")]),
    "F": dict(bhk=3, page=21, carpet=1486, balcony=143.3, sbu=1747, uds=573.47, facing="West",
              building_entry="S", flat_entry="W", bedrooms_dir="NW / SW / NE", kitchen_dir="SE",
              bathrooms_dir="N / S", floors=[1, 2, 3, 4], position="South-east corner (east row, south end)",
              rooms=[("Bedroom-1", "12'", "12'"), ("Bedroom-2", "12'", "12'"), ("Bedroom-3", "14'", "12'4\""),
                     ("Bathroom (Bedroom-1)", "4'6\"", "8'"), ("Bathroom (Bedroom-2)", "4'6\"", "8'"),
                     ("Bathroom (Bedroom-3)", "4'6\"", "8'"), ("Hall (living + dining)", "28'4\"", "11'"),
                     ("Kitchen (incl. utility)", "10'", "12'4\""), ("Service", "4'6\"", "8'"),
                     ("Balcony (hall, east)", "7'1\"", "10'8\""), ("Balcony (Bedroom-3, south)", "10'6\"", "3'6\""),
                     ("Balcony (kitchen side, south)", "10'6\"", "3'6\"")]),
}

FURNITURE_LAYOUT = {
    "A": "Hall: 3-seat sofa + 2 armchairs around a round coffee table near the entry; 6-seat rectangular dining "
         "table (navy chairs) by the west balcony. Bedrooms: queen/king beds with twin side tables; wardrobes in "
         "the bathroom-lobby niches of Bedrooms 1 & 2 and an L-wardrobe in Bedroom-3. Balcony: 2 chairs + side table.",
    "B": "Hall: 2-seat sofa + armchair + coffee table at the entry end; 6-seat rectangular dining (sage chairs) "
         "toward the west balcony. Bedroom-2: bed + linear wardrobe; Bedroom-1: bed + wardrobe by the door.",
    "C": "Squarer 16' x 18'8\" hall: 3-seat sofa + 2 armchairs + round coffee table to the north; 6-seat dining "
         "(charcoal chairs) at the centre. Back-to-back linear wardrobes between Bedrooms 1 and 2.",
    "D": "Hall: 3-seat sofa + 2 armchairs + coffee table at the entry (west) end; 6-seat dining (sage chairs) "
         "near the east balcony. Wardrobes in the bathroom-lobby niches; L-wardrobe in Bedroom-3.",
    "E": "Compact hall: 2-seat sofa + armchair + 2 nesting tables; 4-seat ROUND dining table. Angled wall in "
         "Bedroom-1 with linear wardrobe; wardrobe in Bedroom-2.",
    "F": "Mirror of A on the east side: sofa set at the entry (west), 6-seat dining (teal chairs) by the east balcony.",
}

# --------------------------------------------------------------------------- specifications (pages 22-23)
SPECIFICATIONS = {
    "structure": {
        "structural_system": "RCC framed structure with raft foundation using M-40 grade of concrete",
        "floor_to_floor_height_incl_slab": "10'",
        "anti_termite_treatment": "Done at various stages of construction",
    },
    "wall_finish": {
        "internal": "Asian Paints - 2 coats wall putty, 1 coat primer, 2 coats emulsion",
        "external": "Asian Paints - 1 coat exterior primer, 2 coats Apex emulsion",
    },
    "ceiling_finish": {"unit_interiors": "False ceiling with lights", "corridor": "False ceiling with decorative lights"},
    "floor_finishes": {
        "living_dining_kitchen": "Glazed vitrified tiles 4' x 2'",
        "bedroom": "Wooden glazed vitrified tiles 48\" x 8\"",
        "balcony": "Wooden glazed vitrified tiles 48\" x 8\"",
    },
    "kitchen_and_dining": {
        "countertop": "Concrete slab finished with high-quality granite",
        "sink": "Premium quality single-bowl sink",
        "faucet": "Kohler",
        "electrical_provision": "Chimney, hob, water purifier, washing machine",
        "lpg": "Centralised metered individual LPG gas line, SS 306 piping",
        "wall_tiles": "Glazed vitrified tiles 4' x 2'",
    },
    "bathrooms": {
        "sanitary_fixtures": "Kohler", "cp_fittings": "Kohler", "floor_traps": "Kohler",
        "wall_finish": "Kajaria glazed vitrified tiles 4' x 2'",
        "floor_finish": "Kajaria glazed vitrified tiles 2' x 2'",
        "shower_partition": "Toughened glass",
    },
    "joinery": {
        "main_door": "4' x 8', 38 mm, teak wood frame, teak veneer with PU polish",
        "bedroom_and_other_doors": "3'6\" x 8', 30 mm, teak wood frame, 1 mm laminate",
        "toilet_doors": "2'9\" x 8', 30 mm, teak wood frame, 1 mm laminate",
        "windows": "Premium UPVC profile windows with toughened glass",
        "ventilators": "Premium UPVC framed louvred shutter with exhaust fan",
    },
    "electrical": {
        "power_supply": "3-phase", "safety": "MCB & ELCB", "switches_sockets": "Legrand modular",
        "wires": "Finolex FRLS copper (or equivalent)", "lights": "Light fixtures included",
        "fans": "Ceiling fans included", "water_heater": "Geyser points in all bathrooms",
        "power_backup_per_unit": "Max 1 kVA per unit",
    },
    "sit_out": {"handrail": "MS handrail as per architect's design"},
    "common_amenities": {
        "lift": "OTIS, 1020 kg (15 pax)", "lift_finishes": "Walls SS finish, floor granite",
        "power_backup": "100% for common areas and selective amenities",
        "name_board": "Apartment owner name board in the lobby",
        "corridor": "Granite floor tiles and false ceiling", "staircase_floor": "Granite",
        "staircase_handrail": "MS",
        "security": ["Security cabin", "RFID access-controlled private lobby", "RFID access-controlled lift",
                     "RFID access-controlled car park entry", "CCTV surveillance for all common areas"],
    },
}

AMENITIES = {  # page 9 (21 amenities) + stilt (p10) and terrace (p13) keys
    "private_comfort_safety_security": ["Management office", "Access-card controlled lift & car park",
                                        "Security & cabin", "CCTV cameras", "Private lobby"],
    "lifestyle": ["Co-working / study room", "Library", "Games corner", "Gym"],
    "outdoor_living": ["Garden", "Playground", "BBQ area", "Roof-top lounge", "Terrace garden lounge",
                       "Outdoor yoga lawn"],
    "infrastructure": ["Smart main door lock", "Centralised gas pipeline", "Water softener",
                       "Power backup generator", "EV charging bay provisions", "False ceiling"],
}
STILT_KEYS = {1: "Private Lobby", 2: "Management Office", 3: "Co-working / Study Room", 4: "Library",
              5: "Playground", 6: "Garden", 7: "Centralised Gasline", 8: "Security Cabin", 9: "Utilities Area"}
TERRACE_KEYS = {10: "Games Corner", 11: "Gym", 12: "BBQ Area", 13: "Rooftop Lounge", 14: "Outdoor Lounge",
                15: "Terrace Garden", 16: "Outdoor Yoga Lawn"}

LOCATION = {  # page 6 table (distance + drive time); page 7 map
    "education": [("Kendriya Vidyalaya", "1.4 km", "4 min"), ("Lady Doak College", "2.0 km", "6 min"),
                  ("The American College", "5.1 km", "10 min")],
    "healthcare": [("Apollo Specialty Hospitals", "5.8 km", "12 min"), ("Vadamalayan Hospitals", "1.8 km", "5 min"),
                   ("Meenakshi Mission Hospital", "6.4 km", "15 min")],
    "shopping": [("Unlimited Fashion Store", "1.0 km", "4 min"), ("Zudio", "1.7 km", "6 min"),
                 ("Style Union", "1.0 km", "4 min"), ("Meenakshi Fan House", "650 m", "2 min"),
                 ("Thangamayil Jewellers", "450 m", "1 min")],
    "hotels_restaurants": [("Hotel Courtyard by Marriott", "2.3 km", "6 min"), ("Hotel JC Residency", "1.7 km", "5 min")],
    "entertainment_leisure": [("Vishaal Mall", "2.4 km", "5 min"), ("Race Course", "3.2 km", "8 min"),
                              ("Madurai Rifle Club", "2.9 km", "7 min")],
    "landmarks": [("Meenakshi Amman Temple", "4.7 km", "12 min"), ("Farmer's Market (Uzhavar Sandhai)", "900 m", "3 min")],
    "connectivity": [("Mattuthavani Bus Stand (Central Bus Terminal)", "5.4 km", "10 min"),
                     ("Madurai International Airport", "20 km", "30 min"), ("Madurai Railway Station", "6 km", "12 min")],
}
MAP_ONLY_LANDMARKS = [  # page 7, no distance given (times in brackets where printed)
    "Chennai Flyover & Highway (8 min)", "St. Joseph Matriculation HSS", "C.E.O.A Matriculation HSS",
    "Devadoss Hospitals", "Mahatma Montessori School", "Preethi Multispeciality & Orthopedics Hospital",
    "Madurai Kamaraj University College", "Government Law College Madurai", "Mahatma Montessori Matriculation HSS",
    "Madurai Medical College", "Government Rajaji Hospital", "Aravind Eye Hospital", "Thiagarajar College",
]


def feet(s: str) -> float:
    m = re.fullmatch(r"(\d+)'(?:(\d+)\")?", s)
    if not m:
        raise ValueError(s)
    return round(int(m.group(1)) + int(m.group(2) or 0) / 12, 4)


def build_units() -> dict:
    units = {}
    for key, u in UNITS.items():
        rooms = []
        for name, a, b in u["rooms"]:
            fa, fb = feet(a), feet(b)
            rooms.append({"name": name, "dimensions_as_printed": f"{a} x {b}",
                          "dim_a_ft_derived": fa, "dim_b_ft_derived": fb,
                          "dim_a_m_derived": round(fa * 0.3048, 3), "dim_b_m_derived": round(fb * 0.3048, 3),
                          "area_sqft_derived": round(fa * fb, 1)})
        labelled = sum(r["area_sqft_derived"] for r in rooms if not r["name"].startswith("Balcony"))
        units[key] = {
            "type": key, "configuration": f"{u['bhk']} BHK", "brochure_page": u["page"],
            "carpet_area_sqft": u["carpet"], "exclusive_balcony_area_sqft": u["balcony"],
            "super_built_up_area_sqft": u["sbu"], "uds_sqft": u["uds"],
            "carpet_to_sbu_ratio_derived": round(u["carpet"] / u["sbu"], 4),
            "vastu": {"label": f"{u['facing']} Facing Flat Vastu", "building_entry": u["building_entry"],
                      "flat_entry": u["flat_entry"], "bedrooms": u["bedrooms_dir"], "kitchen": u["kitchen_dir"],
                      "bathrooms": u["bathrooms_dir"]},
            "available_on_floors": u["floors"], "position_on_typical_floor": u["position"],
            "rooms": rooms,
            "sum_of_labelled_room_areas_excl_balconies_sqft_derived": round(labelled, 1),
            "furniture_layout_as_drawn": FURNITURE_LAYOUT[key],
        }
    return units


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, type=Path)
    out: Path = ap.parse_args().out.resolve()
    units = build_units()

    info = {
        "_about": "Structured extraction of the Shan Poornam Residence brochure (36 pp., 11-05-2026). "
                  "Keys ending in _derived are computed, not printed in the brochure.",
        "project": {
            "name_in_brochure": "Shan Poornam Residence",
            "short_names": ["SP Residence (brochure p28)", "SPR (brochure file name)",
                            "SP Residency (client's working name)"],
            "tagline": "Boutique Living in the Heart of Madurai",
            "developer": "Shan Poornam Development Pvt. Ltd. (an ENS Development company)",
            "collaboration_partner": "SKR Elite Properties Pvt. Ltd. (SKR Group)",
            "brand_story": {
                "shan": "Five (Sanskrit) - the five elements Earth, Fire, Water, Air, Space; symbolised by the Sun",
                "poornam": "Completeness (Sanskrit) - symbolised by the Moon: calm, rhythm, reflection",
                "philosophy": "Sun-Moon balance: homes that combine energy and purpose; complete and built to last",
            },
            "site_address": "PT Rajan Road, Visalakshipuram, Madurai - 625014 (Reserve Police Line area)",
            "sales_contact_in_brochure": {"phone_whatsapp": "+91 81100 04007", "website": "www.spresidence.com",
                                          "email": "sales@skrgroup.co"},
            "brochure_pages": [1, 2, 3, 5, 25, 27, 34, 35, 36],
        },
        "building": {
            "levels": "Stilt (parking + lobby amenities) + 5 residential floors + terrace amenity level",
            "residential_floors": 5,
            "total_homes": 26,
            "unit_mix": {"4 BHK": 1, "3 BHK": 13, "2 BHK": 12},
            "typical_floor_units": ["A (3BHK)", "B (2BHK)", "C (2BHK)", "D (3BHK)", "E (2BHK)", "F (3BHK)"],
            "typical_floor_applies_to": "Floors 1-4 (each unit page: 'Available on 1st, 2nd, 3rd and 4th floors')",
            "fifth_floor_derived": "26 - (6 units x 4 floors) = 2 homes on the 5th floor. Unit mix implies "
                                   "1 x 4 BHK + 1 x 3 BHK there. NO 5th-floor plan is in the brochure.",
            "floor_to_floor_height": "10' incl. slab (p22)",
            "typical_floor_layout": "Central N-S double-loaded corridor with landscaped courts at both ends; "
                                    "west row C-B-[stair+lift]-A, east row D-E-F; road along the south edge; "
                                    "building entry from the south (p15).",
            "vertical_circulation": "1 staircase + 1 lift (OTIS 1020 kg / 15 pax) on the west side of the corridor",
            "carpet_efficiency": "Up to 85% carpet/SBU - 'highest among all builders in Tamil Nadu' (developer claim)",
            "low_density_claim": "26 homes across 5 floors",
            "amenities_count": 21,
            "exterior_visual_language_from_renders": [
                "White projecting box frames around stacked bay windows / balconies, wood-tone soffits",
                "Full-height warm copper / teak-tone vertical louvre fins in large fields",
                "Warm grey painted walls (spec: Asian Paints Apex exterior emulsion)",
                "Sandstone/travertine-look vertical pylon with teal SP sun monogram at the parapet",
                "MS vertical-bar handrails (spec), white UPVC windows with toughened glass (spec)",
                "Cascading planters at ledges; planted slot at the south end of the corridor",
                "Stilt parking with hazard-striped columns; dark soffit with exposed sprinkler mains",
                "Timber-look compound wall with boom barriers at both vehicle openings; rubble-stone wall segment",
                "Illuminated security cabin with teal 'Shan Poornam Residence by ENS' signage",
                "Rooftop trees / terrace garden visible at the parapet",
            ],
            "exterior_material_note": "Louvre, cladding and stone-look materials are visible in renders but NOT "
                                      "specified in the brochure specification pages.",
            "brochure_pages": [4, 5, 10, 13, 15, 22, 26, 28],
        },
        "stilt_floor": {"keys": STILT_KEYS, "brochure_page": 10,
                        "notes": "Two-way central drive aisle, perimeter parking bays, perimeter landscape strips, "
                                 "playground NE, lobby block on the west, security cabin at the south-east vehicle "
                                 "opening. Cars drawn are illustrative - parking count not stated."},
        "terrace_floor": {"keys": TERRACE_KEYS, "brochure_page": 13},
        "amenities": AMENITIES,
        "units": units,
        "specifications": SPECIFICATIONS,
        "location": {
            "area": "Visalakshipuram, Reserve Police Line, Madurai",
            "why_it_matters": ["Established residential neighbourhood", "Excellent access to schools & hospitals",
                               "Daily conveniences within minutes", "Smooth city-wide connectivity",
                               "Peaceful surroundings with urban advantages"],
            "distances": {k: [{"name": n, "distance": d, "drive_time": t} for n, d, t in v]
                          for k, v in LOCATION.items()},
            "map_only_landmarks": MAP_ONLY_LANDMARKS,
            "public_transport": "Multiple city bus stops within walking distance",
            "brochure_pages": [5, 6, 7],
        },
        "interior_design_references": {
            "available": ["Living + dining hall (p25)", "Bedroom with tropical-leaf feature wall (p24)",
                          "Balcony sit-out (p24)", "Typical-floor corridor (p24)", "Private lobby (p11)",
                          "Lobby lounge / library (p25, uncaptioned)", "Management office (p11)",
                          "Co-working / study (p11)", "Gym x2 (p12)", "Rooftop lounge (p12)"],
            "not_available": ["Kitchen", "Pooja room / unit", "Bathrooms", "Secondary bedrooms",
                              "Standalone dining view", "Wardrobe close-ups", "4 BHK / 5th-floor unit"],
            "palette": ["Travertine-look beige stone panels", "Dark walnut (fluted and flat)", "Warm white walls",
                        "Light beige large-format vitrified floor", "Wide-plank walnut-look floor (bedrooms)",
                        "Honey wood-look floor (balcony)", "Brushed brass accents", "Taupe / sand textiles",
                        "Rust and mustard accent cushions", "Charcoal leather (lobby)", "Black metal shelving"],
        },
        "missing_information": [
            "5th-floor plan (the 4 BHK and the 13th 3 BHK) - not in brochure",
            "Plot area, built-up area, FSI, setbacks, overall building footprint and height",
            "Stilt (ground) floor height; terrace/parapet heights; floor-to-ceiling height below false ceiling",
            "Wall thicknesses, window/door schedule positions (sizes for doors only), sill heights",
            "Side and rear elevations; any section drawing",
            "Facade material specification for louvres / stone-look cladding / frames",
            "Car-parking count and bay sizes; EV bay locations",
            "Kitchen, bathroom, pooja and secondary-bedroom interior designs",
        ],
        "inconsistencies_noted": [
            "Bus stand spelled 'Maatuthavani' (p6) and 'Mattuthavani' (p7).",
            "'Apollo Specialty Hospitals' (p6) vs 'Apollo Speciality Hospitals' (p7).",
            "Unit B Vastu lists kitchen 'NW' while all other units list 'SE' - reported as printed.",
            "Unit pages say floors 1-4 only; total of 26 homes requires 2 further homes not drawn.",
            "Disclaimer (p34): kitchen measurements include the utility area.",
        ],
        "disclaimer_summary": "Brochure states all images, plans, finishes and furniture are artists' impressions, "
                              "subject to change, and not part of any offer or contract (pp. 4, 11, 13, 14, 25, 27, 34, 36).",
        "excluded_from_sp_residency": "Pages 28-33 depict the developers' other projects (Crown Penang, Radisson RAK, "
                                      "Madurai commercial work, upcoming projects).",
    }

    (out / "analysis").mkdir(parents=True, exist_ok=True)
    (out / "analysis" / "project-information.json").write_text(json.dumps(info, indent=2, ensure_ascii=False) + "\n")

    geometry = {
        "_about": "Room schedule per unit for conceptual 3D modelling. Brochure dimensions are as printed; "
                  "metric values are derived (1 ft = 0.3048 m). NOT construction-accurate - see 3d/modelling-specification.md.",
        "floor_to_floor_ft": 10, "floor_to_floor_m_derived": 3.048,
        "units": {k: {"configuration": v["configuration"], "carpet_area_sqft": v["carpet_area_sqft"],
                      "flat_entry": v["vastu"]["flat_entry"], "position": v["position_on_typical_floor"],
                      "rooms": v["rooms"],
                      "sum_of_labelled_room_areas_excl_balconies_sqft_derived":
                          v["sum_of_labelled_room_areas_excl_balconies_sqft_derived"]}
                  for k, v in units.items()},
    }
    (out / "3d").mkdir(parents=True, exist_ok=True)
    (out / "3d" / "unit-geometry.json").write_text(json.dumps(geometry, indent=2, ensure_ascii=False) + "\n")
    for k, v in units.items():
        print(k, v["configuration"], v["carpet_area_sqft"], "labelled rooms:",
              v["sum_of_labelled_room_areas_excl_balconies_sqft_derived"], "ratio", v["carpet_to_sbu_ratio_derived"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
