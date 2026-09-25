from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..services.azure_ai import AzureAIService

router = APIRouter(prefix="/azure", tags=["Azure AI Services"])


class HealthInsightsRequest(BaseModel):
    text: str
    appointment_id: Optional[int] = None


class NeuralSpeechRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-IN-NeerjaNeural"


class DocumentAnalysisRequest(BaseModel):
    sample_type: Optional[str] = "blood_panel" # or "rx_prescription"
    file_base64: Optional[str] = None


@router.get("/status")
def get_azure_status():
    """
    Returns the operational configuration of Microsoft Azure AI services.
    """
    return {
        "status": "ready",
        "live_azure_connected": AzureAIService.is_configured(),
        "services": [
            {
                "name": "Azure AI Text Analytics for Health",
                "capability": "Clinical NLP, ICD-10, SNOMED & Negation Detection",
                "tier": "$100 Azure Subscription Active",
                "status": "Online"
            },
            {
                "name": "Azure AI Neural Speech",
                "capability": "Bilingual Indian Accent TTS (en-IN-NeerjaNeural / hi-IN-SwaraNeural)",
                "tier": "Cognitive Services Neural",
                "status": "Online"
            },
            {
                "name": "Azure AI Document Intelligence",
                "capability": "Prescription & Lab Biomarker OCR Engine (prebuilt-read / layout)",
                "tier": "Standard S0",
                "status": "Online"
            }
        ]
    }


@router.post("/health-insights")
def analyze_health_insights(payload: HealthInsightsRequest):
    """
    Analyzes patient complaints/symptoms using Azure AI Text Analytics for Health.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    result = AzureAIService.analyze_health_text(payload.text)
    return result


@router.post("/tts")
def synthesize_neural_speech(payload: NeuralSpeechRequest):
    """
    Synthesizes text into Indian-accent neural voice using Azure AI Speech.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    voice = payload.voice or "en-IN-NeerjaNeural"
    result = AzureAIService.synthesize_neural_speech(payload.text, voice=voice)
    return result


@router.post("/analyze-document")
def analyze_medical_document(payload: DocumentAnalysisRequest):
    """
    Extracts vitals, biomarkers, and prescriptions using Azure AI Document Intelligence.
    """
    sample_type = payload.sample_type or "blood_panel"
    result = AzureAIService.analyze_clinical_document(
        sample_type=sample_type,
        file_base64=payload.file_base64
    )
    return result
