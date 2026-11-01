"""SPARK Core Domain Models & Data Structures.

Defines the entity representations for caregivers, pediatric milestone profiles,
candidate venues, and optimized outing agendas.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass
class OriginLocation:
    """Caregiver starting location coordinates and label."""
    latitude: float
    longitude: float
    name: str = "Home Origin"


@dataclass
class MilestoneVector:
    """Normalized 8-dimensional CDC milestone developmental scores."""
    soc_emot: float = 0.0
    cog_exec: float = 0.0
    lang_comm: float = 0.0
    phys_motor: float = 0.0
    expl_creat: float = 0.0
    found_knowl: float = 0.0
    ind_lifeskills: float = 0.0
    health: float = 0.0

    def to_dict(self) -> Dict[str, float]:
        return {
            "soc_emot": self.soc_emot,
            "cog_exec": self.cog_exec,
            "lang_comm": self.lang_comm,
            "phys_motor": self.phys_motor,
            "expl_creat": self.expl_creat,
            "found_knowl": self.found_knowl,
            "ind_lifeskills": self.ind_lifeskills,
            "health": self.health,
        }


@dataclass
class ItineraryStop:
    """A scheduled physical or activity stop in the optimized outing."""
    selection_order: int
    poi_id: int
    name: str
    venue_type: str
    activity: str
    distance_miles: float
    latitude: float
    longitude: float
    factor_scores: Dict[str, float] = field(default_factory=dict)
    dwell_minutes: int = 45
    transit_minutes: float = 0.0


@dataclass
class OutingOptimizationPlan:
    """The complete result payload produced by the combinatorial optimization engine."""
    status: str
    objective_value: float
    development_value: float
    distance_cost: float
    redundancy_score: float
    unique_activities: int
    unique_pois: int
    developmental_coverage: Dict[str, Any]
    agenda: List[Dict[str, Any]]
    total_driving_minutes: float = 0.0
    total_dwell_minutes: int = 0
    origin: Optional[OriginLocation] = None

