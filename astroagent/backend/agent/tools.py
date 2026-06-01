"""
AstroAgent Tools
- geocode_place: resolve place name -> lat/lon/timezone
- compute_birth_chart: ephemeris-based natal chart via pyswisseph
- get_daily_transits: current planetary transits vs natal chart
- knowledge_lookup: RAG over astrology reference notes
"""

import swisseph as swe
import datetime
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
import pytz
from langchain_core.tools import tool
from typing import Optional
import os
import json

# ── ephemeris data path (bundled with pyswisseph) ──────────────────────────
swe.set_ephe_path(None)   # uses built-in Moshier ephemeris if no path set

PLANETS = {
    "Sun":     swe.SUN,
    "Moon":    swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus":   swe.VENUS,
    "Mars":    swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn":  swe.SATURN,
    "Uranus":  swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto":   swe.PLUTO,
}

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

def _deg_to_sign(deg: float) -> dict:
    sign_idx = int(deg // 30)
    deg_in_sign = deg % 30
    return {
        "sign": ZODIAC_SIGNS[sign_idx],
        "degrees": round(deg_in_sign, 2),
        "absolute_degrees": round(deg, 2)
    }


@tool
def geocode_place(place_name: str) -> dict:
    """
    Resolve a place name to latitude, longitude, and IANA timezone string.
    Required before computing a birth chart.
    """
    try:
        geolocator = Nominatim(user_agent="astroagent_v1")
        location = geolocator.geocode(place_name, timeout=10)
        if not location:
            return {"error": f"Could not find location: {place_name}"}

        tf = TimezoneFinder()
        tz_name = tf.timezone_at(lat=location.latitude, lng=location.longitude)
        if not tz_name:
            tz_name = "UTC"

        return {
            "place": location.address,
            "lat": round(location.latitude, 6),
            "lon": round(location.longitude, 6),
            "timezone": tz_name
        }
    except Exception as e:
        return {"error": str(e)}


@tool
def compute_birth_chart(
    date: str,
    lat: float,
    lon: float,
    timezone: str,
    time: Optional[str] = None,
) -> dict:
    """
    Compute a natal birth chart using Swiss Ephemeris.
    date: YYYY-MM-DD
    time: HH:MM 24-hour (optional, defaults to 12:00 noon if unknown)
    lat/lon: float coordinates
    timezone: IANA timezone string e.g. 'Asia/Kolkata'
    Returns planetary positions and house cusps.
    """
    try:
        birth_time = time if time else "12:00"
        time_note = "" if time else " (birth time unknown — using noon; house cusps may be approximate)"
        # Parse local birth datetime and convert to UTC
        tz = pytz.timezone(timezone)
        dt_local = datetime.datetime.strptime(f"{date} {birth_time}", "%Y-%m-%d %H:%M")
        dt_local = tz.localize(dt_local)
        dt_utc = dt_local.astimezone(pytz.utc)

        # Julian day number
        jd = swe.julday(
            dt_utc.year, dt_utc.month, dt_utc.day,
            dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
        )

        # Compute planetary positions
        planets = {}
        for name, planet_id in PLANETS.items():
            pos, _ = swe.calc_ut(jd, planet_id, swe.FLG_SWIEPH)
            planets[name] = _deg_to_sign(pos[0])
            planets[name]["retrograde"] = pos[3] < 0  # negative speed = retrograde

        # Compute houses (Placidus system)
        houses, ascmc = swe.houses(jd, lat, lon, b"P")
        house_cusps = {f"House_{i+1}": _deg_to_sign(houses[i]) for i in range(12)}

        ascendant = _deg_to_sign(ascmc[0])
        midheaven = _deg_to_sign(ascmc[1])

        return {
            "planets": planets,
            "houses": house_cusps,
            "ascendant": ascendant,
            "midheaven": midheaven,
            "julian_day": jd,
            "birth_utc": dt_utc.isoformat(),
            "note": time_note,
        }

    except Exception as e:
        return {"error": str(e)}


@tool
def get_daily_transits(natal_chart: dict, date: Optional[str] = None) -> dict:
    """
    Compute today's (or given date's) planetary transits and compare them
    to the natal chart to identify significant aspects.
    date: YYYY-MM-DD (defaults to today)
    natal_chart: the output of compute_birth_chart
    """
    try:
        if date is None:
            date = datetime.date.today().isoformat()
        # Ensure we always use the real system date, never a hardcoded fallback
        dt = datetime.datetime.strptime(date, "%Y-%m-%d")
        jd = swe.julday(dt.year, dt.month, dt.day, 12.0)  # noon UTC

        transit_positions = {}
        for name, planet_id in PLANETS.items():
            pos, _ = swe.calc_ut(jd, planet_id, swe.FLG_SWIEPH)
            transit_positions[name] = _deg_to_sign(pos[0])

        # Identify aspects (conjunction=0, sextile=60, square=90, trine=120, opposition=180)
        ASPECTS = {
            "Conjunction": (0, 8),
            "Sextile": (60, 6),
            "Square": (90, 8),
            "Trine": (120, 8),
            "Opposition": (180, 8),
        }

        aspects_found = []
        natal_planets = natal_chart.get("planets", {})

        for t_planet, t_pos in transit_positions.items():
            for n_planet, n_pos in natal_planets.items():
                diff = abs(t_pos["absolute_degrees"] - n_pos["absolute_degrees"])
                if diff > 180:
                    diff = 360 - diff
                for aspect_name, (angle, orb) in ASPECTS.items():
                    if abs(diff - angle) <= orb:
                        aspects_found.append({
                            "transit_planet": t_planet,
                            "natal_planet": n_planet,
                            "aspect": aspect_name,
                            "orb": round(abs(diff - angle), 2)
                        })

        return {
            "date": date,
            "transit_positions": transit_positions,
            "aspects_to_natal": aspects_found
        }

    except Exception as e:
        return {"error": str(e)}


@tool
def knowledge_lookup(query: str) -> dict:
    """
    Look up astrology reference knowledge (planet meanings, house meanings,
    sign traits, aspect interpretations) from the curated knowledge base.
    """
    try:
        from rag.vectorstore import query_knowledge_base
        results = query_knowledge_base(query, k=4)
        return {"query": query, "results": results}
    except Exception as e:
        # Fallback: return basic built-in knowledge
        return _fallback_knowledge(query)


def _fallback_knowledge(query: str) -> dict:
    """Basic fallback when vector store isn't initialized."""
    knowledge = {
        "sun": "The Sun represents the core self, ego, identity, and life purpose. It shows where you shine and seek recognition.",
        "moon": "The Moon governs emotions, instincts, subconscious patterns, and the inner world. It shows how you nurture and what you need for security.",
        "mercury": "Mercury rules communication, thinking, learning, and travel. It shows how you process and share information.",
        "venus": "Venus governs love, beauty, values, and relationships. It shows what you find attractive and how you relate to others.",
        "mars": "Mars rules action, desire, drive, and assertion. It shows how you pursue goals and handle conflict.",
        "jupiter": "Jupiter represents expansion, wisdom, growth, and luck. It shows where you find abundance and optimism.",
        "saturn": "Saturn governs discipline, responsibility, karma, and life lessons. It shows where you face challenges and build mastery.",
        "aries": "Aries: Bold, pioneering, impulsive, courageous. The initiator of the zodiac.",
        "taurus": "Taurus: Steadfast, sensual, patient, stubborn. Values stability and material comfort.",
        "gemini": "Gemini: Curious, adaptable, communicative, dual-natured. Thrives on variety and information.",
        "cancer": "Cancer: Nurturing, intuitive, emotional, protective. Home and family are sacred.",
        "leo": "Leo: Generous, dramatic, confident, creative. Seeks recognition and leads with heart.",
        "virgo": "Virgo: Analytical, service-oriented, precise, health-conscious. Refines and improves.",
        "libra": "Libra: Harmonious, fair, relationship-focused, indecisive. Seeks balance and beauty.",
        "scorpio": "Scorpio: Intense, transformative, secretive, powerful. Probes beneath the surface.",
        "sagittarius": "Sagittarius: Adventurous, philosophical, optimistic, restless. Seeks truth and freedom.",
        "capricorn": "Capricorn: Ambitious, disciplined, pragmatic, reserved. Builds toward lasting achievement.",
        "aquarius": "Aquarius: Innovative, humanitarian, unconventional, detached. Envisions the future.",
        "pisces": "Pisces: Compassionate, dreamy, intuitive, boundaryless. Connects to the universal.",
    }
    q = query.lower()
    results = []
    for key, val in knowledge.items():
        if key in q:
            results.append({"topic": key, "content": val, "relevance": "high"})
    if not results:
        results.append({"topic": "general", "content": "Astrology is the study of the movements and relative positions of celestial bodies interpreted as having an influence on human affairs.", "relevance": "low"})
    return {"query": query, "results": results}
