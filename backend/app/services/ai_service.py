"""
services/ai_service.py — Fact-sheet-grounded AI chat with multi-language support
and hard guardrails for pricing/discount queries.

Design:
  1. Guardrail pass  — block queries about final prices, discounts, negotiations.
  2. Booking intent  — detect site-visit intent and surface the booking CTA.
  3. Fact-sheet RAG  — keyword-match against `fact_sheets` rows for the project.
  4. Handoff fallback — if no grounded answer exists, trigger sales handoff.

Phase 3 hook: replace `_llm_rerank()` stub with Gemini API call when
GEMINI_API_KEY is set in .env.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.fact_sheet import FactSheet
from app.schemas.chat import ChatResponse, Language


# ── Guardrail keyword sets ────────────────────────────────────────────────────
_PRICING_GUARDRAILS: frozenset[str] = frozenset(
    {
        "discount", "negotiate", "negotiable", "final price", "last price",
        "best price", "lowest price", "special offer", "offer", "deal",
        "extra discount", "reduced", "concession", "nett price",
    }
)

_BOOKING_TRIGGERS: frozenset[str] = frozenset(
    {
        "visit", "site visit", "see the property", "tour", "walk-through",
        "walkthrough", "schedule visit", "book visit", "appointment",
        "can i come", "want to come", "want to see", "mujhe dekhna",
        "mulakat", "aavvu chhe", "jovu chhe",
    }
)

# ── Multilingual static messages ──────────────────────────────────────────────
_HANDOFF_MSG: dict[Language, str] = {
    Language.english:  (
        "I don't have that specific information in our knowledge base. "
        "Let me connect you with one of our sales experts who can help you better. 📞"
    ),
    Language.hindi:    (
        "मुझे यह जानकारी उपलब्ध नहीं है। "
        "मैं आपको हमारी बिक्री टीम से जोड़ता हूँ जो आपकी बेहतर सहायता कर सकती है। 📞"
    ),
    Language.gujarati: (
        "મને આ માહિતી ઉપલબ્ધ નથી. "
        "હું તમને અમારી વેચાણ ટીમ સાથે જોડું છું જે તમને વધુ સારી રીતે મદદ કરી શકે. 📞"
    ),
}

_GUARDRAIL_MSG: dict[Language, str] = {
    Language.english:  (
        "For accurate pricing, special offers, or negotiation details, "
        "our sales team will give you the most up-to-date information. "
        "Shall I arrange a callback? 🤝"
    ),
    Language.hindi:    (
        "सटीक मूल्य निर्धारण और विशेष प्रस्तावों के लिए कृपया हमारी बिक्री टीम से संपर्क करें। "
        "क्या मैं कॉलबैक की व्यवस्था करूँ? 🤝"
    ),
    Language.gujarati: (
        "ચોક્કસ ભાવ અને ખાસ ઓફર માટે કૃપા કરીને અમારી વેચાણ ટીમ સાથે સંપર્ક કરો. "
        "શું હું કૉલબૅક ગોઠવું? 🤝"
    ),
}

_BOOKING_MSG: dict[Language, str] = {
    Language.english:  (
        "I'd love to arrange a site visit for you! "
        "Please use the booking form below to pick a convenient slot. 🏠"
    ),
    Language.hindi:    (
        "मैं आपके लिए साइट विजिट की व्यवस्था कर सकता हूँ! "
        "नीचे बुकिंग फॉर्म का उपयोग करके अपना समय चुनें। 🏠"
    ),
    Language.gujarati: (
        "હું તમારા માટે સાઇટ વિઝિટ ગોઠવી શકું છું! "
        "કૃપા કરીને નીચેના બુકિંગ ફૉર્મ દ્વારા સ્લૉટ પસંદ કરો. 🏠"
    ),
}


@dataclass
class _MatchResult:
    score: int
    fact: FactSheet


class AIService:
    """Stateless service — instantiate once and reuse across requests."""

    # ── Public API ────────────────────────────────────────────────────────────
    def get_response(
        self,
        message: str,
        language: Language,
        db: Session,
        project_id: int | None = None,
    ) -> ChatResponse:
        norm = self._normalise(message)

        # 1. Guardrail: pricing / discount queries → safe handoff
        if self._hits_guardrail(norm):
            return ChatResponse(
                reply=_GUARDRAIL_MSG[language],
                handoff_required=True,
                handoff_reason="pricing_guardrail",
                suggested_action="request_callback",
            )

        # 2. Booking intent detected
        if self._has_booking_intent(norm):
            return ChatResponse(
                reply=_BOOKING_MSG[language],
                handoff_required=False,
                suggested_action="open_booking_form",
            )

        # 3. Fact-sheet RAG
        best = self._search_fact_sheets(norm, db, project_id)
        if best and best.score >= 1:
            return ChatResponse(
                reply=best.fact.answer,
                handoff_required=False,
                matched_category=best.fact.category,
            )

        # 4. No grounded answer → human handoff
        return ChatResponse(
            reply=_HANDOFF_MSG[language],
            handoff_required=True,
            handoff_reason="no_grounded_answer",
            suggested_action="connect_sales_executive",
        )

    # ── Helpers ───────────────────────────────────────────────────────────────
    @staticmethod
    def _normalise(text: str) -> str:
        return re.sub(r"[^\w\s]", " ", text.lower()).strip()

    @staticmethod
    def _hits_guardrail(norm: str) -> bool:
        return any(kw in norm for kw in _PRICING_GUARDRAILS)

    @staticmethod
    def _has_booking_intent(norm: str) -> bool:
        return any(kw in norm for kw in _BOOKING_TRIGGERS)

    @staticmethod
    def _search_fact_sheets(
        norm: str,
        db: Session,
        project_id: int | None,
    ) -> _MatchResult | None:
        """
        Keyword-score every FactSheet for the project.
        Returns the highest-scoring match or None.
        """
        query = db.query(FactSheet)
        if project_id:
            query = query.filter(FactSheet.project_id == project_id)
        facts = query.all()

        if not facts:
            return None

        keywords = [w for w in norm.split() if len(w) > 2]  # skip stopwords
        best: _MatchResult | None = None

        for fact in facts:
            combined = (fact.question + " " + fact.answer).lower()
            score = sum(1 for kw in keywords if kw in combined)
            if score > 0 and (best is None or score > best.score):
                best = _MatchResult(score=score, fact=fact)

        return best


# Module-level singleton
ai_service = AIService()

