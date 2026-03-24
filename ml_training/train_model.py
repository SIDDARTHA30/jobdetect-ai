"""
ML Training Script for Job Posting Classifier
Run from the ml_training/ folder:
    python train_model.py

Saves model to: ../backend/saved_models/job_classifier.pkl
Always run this AFTER installing requirements.txt so the model
is built with the same sklearn version that will load it.
"""

import pickle
import random
import warnings
import os
from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import numpy as np

warnings.filterwarnings("ignore")

CATEGORIES = [
    "software_engineering", "data_science", "product_management",
    "design", "marketing", "sales", "finance", "operations",
    "customer_support", "human_resources", "legal", "healthcare",
]

TEMPLATES = {
    "software_engineering": [
        "Senior Backend Engineer Python Django REST APIs microservices AWS Docker Kubernetes CI/CD",
        "Full Stack Developer React Node.js TypeScript GraphQL PostgreSQL cloud deployment",
        "Software Architect distributed systems scalability high availability system design",
        "DevOps Engineer infrastructure automation Terraform Jenkins Helm monitoring observability",
        "Mobile Developer iOS Android Swift Kotlin cross-platform React Native Flutter",
    ],
    "data_science": [
        "Data Scientist machine learning deep learning Python sklearn TensorFlow PyTorch NLP",
        "ML Engineer model deployment MLOps feature engineering A/B testing recommendation systems",
        "Data Analyst SQL dashboards business intelligence Tableau PowerBI insights reporting",
        "AI Researcher computer vision NLP transformers BERT GPT research publications",
        "Data Engineer pipelines ETL Spark Airflow dbt warehouse Redshift BigQuery Snowflake",
    ],
    "product_management": [
        "Product Manager roadmap stakeholder alignment agile sprint OKRs user research",
        "Senior PM B2B SaaS product strategy customer discovery PRD feature prioritization",
        "Growth PM experimentation conversion funnel retention activation metrics",
        "Technical Product Manager engineering collaboration API product developer experience",
        "Product Lead vision strategy cross-functional team leadership go-to-market",
    ],
    "design": [
        "UX Designer user research wireframes prototypes Figma design systems accessibility",
        "UI Designer visual design typography color systems component libraries interaction",
        "Product Designer end-to-end design user journey information architecture usability",
        "Brand Designer identity visual communication illustration motion graphic design",
        "Design Lead creative direction mentoring team design culture systems thinking",
    ],
    "marketing": [
        "Digital Marketing Manager SEO SEM content strategy social media campaigns analytics",
        "Growth Marketer email campaigns paid acquisition funnel optimization CRO landing pages",
        "Content Strategist editorial calendar brand voice copywriting blog thought leadership",
        "Marketing Analyst attribution multi-channel performance ROI reporting dashboards",
        "Demand Generation B2B lead nurturing marketing automation HubSpot Marketo",
    ],
    "sales": [
        "Account Executive enterprise SaaS sales cycle prospecting quota closing CRM",
        "Sales Development Representative outbound cold calling pipeline generation discovery",
        "Sales Engineer technical presales solution selling demos proof of concept",
        "Customer Success Manager renewal expansion upsell churn reduction NPS CSAT",
        "VP Sales revenue strategy team leadership forecasting hiring enablement",
    ],
    "finance": [
        "Financial Analyst FP&A modeling forecasting budgeting variance analysis reporting",
        "Accountant GAAP reconciliation audits tax compliance general ledger month-end",
        "Controller financial statements internal controls SOX compliance accounting team",
        "Investment Analyst valuation DCF comparable analysis equity research portfolio",
        "CFO capital allocation fundraising investor relations treasury risk management",
    ],
    "operations": [
        "Operations Manager process improvement workflow efficiency metrics KPIs ops team",
        "Supply Chain Manager procurement logistics vendor management inventory optimization",
        "Project Manager PMP agile waterfall stakeholders risk budget timeline delivery",
        "Business Analyst requirements gathering process mapping systems analysis workflows",
        "COO operational strategy scaling execution cross-functional leadership",
    ],
    "customer_support": [
        "Customer Support Specialist tickets helpdesk SLA escalation Zendesk CSAT empathy",
        "Technical Support Engineer troubleshooting debugging L2 L3 escalation knowledge base",
        "Support Team Lead coaching quality QA training CSAT metrics performance improvement",
        "Customer Experience Manager journey mapping feedback loop retention satisfaction",
        "Help Desk Technician IT support hardware software network users onboarding",
    ],
    "human_resources": [
        "HR Business Partner talent management performance reviews compensation culture",
        "Recruiter sourcing screening interviews pipeline ATS hiring managers job offers",
        "People Ops Manager onboarding offboarding benefits policy employee relations",
        "Learning Development Manager training programs LMS upskilling career paths",
        "CHRO people strategy org design workforce planning DEI engagement retention",
    ],
    "legal": [
        "Corporate Counsel contracts compliance regulatory risk IP M&A legal advice",
        "Compliance Officer regulatory requirements audit risk assessment policy SOX GDPR",
        "Paralegal legal research document review filings case management attorney support",
        "Employment Attorney HR law disputes EEOC litigation employment contracts",
        "Privacy Counsel data protection GDPR CCPA privacy policy consent legal frameworks",
    ],
    "healthcare": [
        "Registered Nurse patient care clinical skills EMR hospital shift bedside manner",
        "Physician diagnosis treatment evidence-based medicine patient outcomes continuity",
        "Healthcare Administrator operations compliance HIPAA staff scheduling budgets",
        "Clinical Research Coordinator trials protocols IRB data FDA regulatory submissions",
        "Medical Coder ICD-10 CPT billing revenue cycle claims reimbursement accuracy",
    ],
}


def generate_synthetic_data(samples_per_class: int = 300):
    X, y = [], []
    random.seed(42)
    np.random.seed(42)
    for category, templates in TEMPLATES.items():
        for _ in range(samples_per_class):
            base = random.choice(templates)
            words = base.split()
            noise = random.sample(words, k=max(3, len(words) // 3))
            extra = " ".join(noise * random.randint(1, 3))
            X.append(f"{base} {extra}")
            y.append(category)
    combined = list(zip(X, y))
    random.shuffle(combined)
    X, y = zip(*combined)
    return list(X), list(y)


def train():
    import sklearn
    print(f"🔧 Generating training data... (sklearn {sklearn.__version__})")
    X, y = generate_synthetic_data(300)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Train: {len(X_train)} | Test: {len(X_test)}")

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=20000,
                                   sublinear_tf=True, min_df=2)),
        ("clf",   LogisticRegression(C=5.0, max_iter=1000, solver="lbfgs",
                                      random_state=42)),
    ])

    print("🤖 Training classifier...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = np.mean(np.array(y_pred) == np.array(y_test))
    print(f"✅ Accuracy: {acc * 100:.1f}%")
    print(classification_report(y_test, y_pred))

    # Save next to backend
    script_dir = Path(__file__).resolve().parent
    out_dir = script_dir.parent / "backend" / "saved_models"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "job_classifier.pkl"

    with open(out_path, "wb") as f:
        pickle.dump(pipeline, f)

    print(f"💾 Model saved → {out_path}")
    print("\n✅ Done! Now start the backend:\n   uvicorn app.main:app --reload --port 8000")
    return pipeline


if __name__ == "__main__":
    train()
