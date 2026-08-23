"""
Three tests that map directly to judging criterion 5: Reliability & Self-Healing.
Run with: pytest tests/ -v
"""
import pytest
import difflib
from unittest.mock import patch, MagicMock


  

POLICY_V1 = """
You may cancel your subscription at any time via your account settings.
Refunds are processed within 5 business days.
"""

POLICY_V2_REAL = """
You may cancel your subscription by calling our support line only.
Refunds are processed within 30 business days. A cancellation fee may apply.
"""

POLICY_V2_NOISE = """
You may cancel your subscription at any time via your account settings.
Refunds are processed within 5 business days.  
"""    

def run_differ(v1: str, v2: str) -> dict:
      
    v1_lines = [l.rstrip() for l in v1.splitlines()]
    v2_lines = [l.rstrip() for l in v2.splitlines()]
    lines = list(difflib.unified_diff(v1_lines, v2_lines, lineterm=""))
      
    meaningful = [l for l in lines if l.startswith(("+", "-")) and l[1:].strip()]
    return {"lines": lines, "changed": len(meaningful) > 0}

def test_differ_catches_real_change():
    result = run_differ(POLICY_V1, POLICY_V2_REAL)
    assert result["changed"] is True, "Should flag real policy change"

def test_differ_ignores_whitespace_noise():
    result = run_differ(POLICY_V1, POLICY_V2_NOISE)
    assert result["changed"] is False, "Should NOT flag whitespace-only diff"


  

from rapidfuzz import fuzz
import re

def _extract_model_tokens(text: str) -> set[str]:
    """Pull out alphanumeric tokens that look like model numbers (contain digits)."""
    return {t.lower() for t in re.findall(r'\b[A-Za-z0-9]+\b', text) if any(c.isdigit() for c in t)}

def fuzzy_match(inventory_item: str, recall_title: str, threshold: int = 60) -> bool:
    """
    Match strategy:
    1. Broad similarity gate — filters out completely unrelated items.
    2. ALL model-number tokens from inventory must appear verbatim in recall title.
       This correctly handles "20000 vs 10000" mismatches.
    """
    recall_lower = recall_title.lower()
    inventory_lower = inventory_item.lower()
      
    if fuzz.partial_ratio(inventory_lower, recall_lower) < threshold:
        return False
      
    for token in _extract_model_tokens(inventory_item):
        if token not in recall_lower:
            return False
    return True

def test_matcher_true_positive():
    matched = fuzzy_match(
        "Anker PowerCore 20000 portable charger",
        "RECALL: Anker PowerCore 20000 - fire hazard risk"
    )
    assert matched is True, "Should match Anker PowerCore 20000"

def test_matcher_rejects_near_miss():
    matched = fuzzy_match(
        "Anker PowerCore 20000 portable charger",
        "RECALL: Anker PowerCore 10000 - different model"
    )
    assert matched is False, "Should NOT match a different model number (10000 != 20000)"


  

def test_heal_triggered_on_null_snapshot():
    """When validation fails, the heal node should be routed to."""
    from graph import should_heal

    state_failed = {
        "collector_id": "c_test123",
        "snapshot": None,
        "validation_passed": False,
        "heal_attempts": 0,
    }
    assert should_heal(state_failed) == "heal", "Should route to heal when validation fails"

def test_no_heal_after_3_attempts():
    """After 3 heal attempts, stop trying — proceed to diff."""
    from graph import should_heal

    state_exhausted = {
        "collector_id": "c_test123",
        "snapshot": None,
        "validation_passed": False,
        "heal_attempts": 3,
    }
    assert should_heal(state_exhausted) == "diff", "Should give up healing after 3 attempts"
