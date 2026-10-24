# Rules in code decide alerts and priorities

Whether an Alerta fires, and how Pendientes are ranked, is decided by plain code over stored data, with no LLM or decision model (such as TypeSafe's Jev) in that path. These decisions must never rest on a wrong or stale price (RNF03), must be explainable afterwards (RNF04) and must never act commercially (RNF10). Deterministic rules meet all three, are unit-testable and run instantly. A model may only assist where a person reviews its output before anything happens, such as drafting a follow-up message (RF08).
