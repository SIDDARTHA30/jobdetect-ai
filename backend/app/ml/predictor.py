import random
from app.ml.model_loader import get_model
from app.ml.preprocess import preprocess_text

CATEGORIES = [
    "software_engineering", "data_science", "product_management",
    "design", "marketing", "sales", "finance", "operations",
    "customer_support", "human_resources", "legal", "healthcare",
]

class Predictor:
    def predict(self, job_input) -> dict:
        model = get_model()
        text = preprocess_text(f"{job_input.title} {job_input.description}")

        if model:
            proba = model.predict_proba([text])[0]
            classes = model.classes_
            scores = {cls: float(p) for cls, p in zip(classes, proba)}
            predicted = max(scores, key=scores.get)
            confidence = scores[predicted]
        else:
            # Mock predictions for demo
            scores = {cat: random.uniform(0.01, 0.3) for cat in CATEGORIES}
            # Bias toward title keywords
            title_lower = job_input.title.lower()
            for cat in CATEGORIES:
                if any(kw in title_lower for kw in cat.split("_")):
                    scores[cat] += random.uniform(0.3, 0.5)
            total = sum(scores.values())
            scores = {k: round(v / total, 4) for k, v in scores.items()}
            predicted = max(scores, key=scores.get)
            confidence = scores[predicted]

        fraud_prob = self._detect_fraud(job_input)

        return {
            "category": predicted,
            "confidence": confidence,
            "all_scores": scores,
            "is_fraudulent": fraud_prob > 0.7,
            "fraud_probability": fraud_prob,
        }

    def _detect_fraud(self, job_input) -> float:
        red_flags = ["work from home", "unlimited earning", "no experience needed",
                     "make money fast", "guaranteed income", "pyramid"]
        text = f"{job_input.title} {job_input.description}".lower()
        flag_count = sum(1 for flag in red_flags if flag in text)
        return min(flag_count * 0.2 + random.uniform(0, 0.1), 1.0)
