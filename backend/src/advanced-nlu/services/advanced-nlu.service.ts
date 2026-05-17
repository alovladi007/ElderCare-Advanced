import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import axios from 'axios';

export interface IntentRecognitionResult {
  primaryIntent: Intent;
  secondaryIntents: Intent[];
  confidence: number;
  multiIntentDetected: boolean;
}

export interface Intent {
  name: string;
  confidence: number;
  parameters?: Record<string, any>;
}

export interface EntityExtractionResult {
  entities: Entity[];
  medicalEntities: MedicalEntity[];
  temporalEntities: TemporalEntity[];
  confidence: number;
}

export interface Entity {
  type: string;
  value: string;
  start: number;
  end: number;
  confidence: number;
}

export interface MedicalEntity {
  type: 'SYMPTOM' | 'BODY_PART' | 'MEDICATION' | 'CONDITION' | 'PROCEDURE';
  value: string;
  normalized: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
}

export interface TemporalEntity {
  type: 'DURATION' | 'DATE' | 'TIME' | 'FREQUENCY';
  value: string;
  normalized: string; // ISO format or standardized value
  confidence: number;
}

export interface EmotionDetectionResult {
  primaryEmotion: Emotion;
  emotions: Emotion[];
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  concernFlags: string[];
}

export interface Emotion {
  name: string;
  confidence: number;
  intensity: number; // 0-1
}

export interface NLUAnalysisResult {
  text: string;
  intents: IntentRecognitionResult;
  entities: EntityExtractionResult;
  emotions: EmotionDetectionResult;
  suggestions: string[];
  timestamp: Date;
}

@Injectable()
export class AdvancedNLUService {
  private readonly logger = new Logger(AdvancedNLUService.name);
  private readonly nluServiceUrl: string;
  private readonly useNLUService: boolean;
  private readonly huggingFaceToken: string;

  // Medical knowledge base
  private readonly medicalTerms = {
    symptoms: ['pain', 'ache', 'dizzy', 'nausea', 'fever', 'tired', 'fatigue', 'weak', 'headache', 'cough', 'cold', 'flu', 'chest pain', 'shortness of breath', 'confused', 'disoriented', 'bleeding', 'swelling', 'rash', 'itching', 'vomiting', 'diarrhea', 'constipation', 'numbness', 'tingling', 'blurred vision', 'hearing loss'],
    bodyParts: ['head', 'chest', 'stomach', 'abdomen', 'back', 'leg', 'arm', 'foot', 'hand', 'knee', 'shoulder', 'neck', 'throat', 'heart', 'lung', 'kidney', 'liver', 'brain', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'teeth', 'finger', 'toe'],
    medications: ['aspirin', 'ibuprofen', 'acetaminophen', 'insulin', 'metformin', 'lisinopril', 'atorvastatin', 'levothyroxine', 'amlodipine', 'metoprolol', 'warfarin', 'gabapentin', 'losartan', 'omeprazole', 'albuterol'],
    conditions: ['diabetes', 'hypertension', 'arthritis', 'dementia', 'alzheimer', 'parkinson', 'stroke', 'heart disease', 'asthma', 'copd', 'osteoporosis', 'depression', 'anxiety', 'cancer'],
  };

  // Intent patterns
  private readonly intentPatterns = {
    EMERGENCY: /\b(help|emergency|urgent|critical|call 911|ambulance|can't breathe|chest pain|falling|fell)\b/i,
    PAIN_REPORT: /\b(pain|hurts?|ache|aching|sore|discomfort)\b/i,
    MEDICATION_QUERY: /\b(medication|medicine|pill|dose|prescription|take|took|forgot)\b/i,
    APPOINTMENT: /\b(appointment|doctor|visit|checkup|schedule|book)\b/i,
    VITALS_CHECK: /\b(blood pressure|heart rate|temperature|glucose|sugar|weight|check)\b/i,
    ACTIVITY_REQUEST: /\b(walk|exercise|activity|move|stretch|yoga)\b/i,
    SOCIAL_INTERACTION: /\b(lonely|talk|chat|call|video|family|friend)\b/i,
    REMINDER: /\b(remind|remember|don't forget|alert|notify)\b/i,
    DEVICE_CONTROL: /\b(turn on|turn off|lights?|temperature|thermostat|lock|unlock)\b/i,
    INFORMATION: /\b(what|when|where|how|why|tell me|information)\b/i,
    MOOD_EXPRESSION: /\b(feel|feeling|sad|happy|worried|anxious|stressed|depressed)\b/i,
  };

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.nluServiceUrl = this.config.get<string>('NLU_SERVICE_URL') || 'http://localhost:5001';
    this.useNLUService = this.config.get<boolean>('USE_NLU_SERVICE') === true;
    this.huggingFaceToken = this.config.get<string>('HUGGINGFACE_TOKEN') || '';
  }

  /**
   * Perform comprehensive NLU analysis on input text
   */
  async analyzeText(text: string, elderId?: string): Promise<NLUAnalysisResult> {
    this.logger.log(`Analyzing text: "${text.substring(0, 50)}..."`);

    try {
      // Run all analyses in parallel
      const [intents, entities, emotions] = await Promise.all([
        this.recognizeIntents(text),
        this.extractEntities(text),
        this.detectEmotions(text),
      ]);

      // Generate contextual suggestions
      const suggestions = this.generateSuggestions(intents, entities, emotions);

      // Store analysis in database if elderId provided
      if (elderId) {
        await this.storeNLUAnalysis(elderId, text, intents, entities, emotions);
      }

      // Check for urgent situations
      if (emotions.urgency === 'CRITICAL' || intents.primaryIntent.name === 'EMERGENCY') {
        await this.handleUrgentSituation(elderId, text, intents, emotions);
      }

      return {
        text,
        intents,
        entities,
        emotions,
        suggestions,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error in NLU analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Recognize intents from text using transformers or rule-based fallback
   */
  async recognizeIntents(text: string): Promise<IntentRecognitionResult> {
    this.logger.log('Recognizing intents from text');

    try {
      // Try ML-based intent recognition first
      if (this.useNLUService) {
        try {
          return await this.mlIntentRecognition(text);
        } catch (error) {
          this.logger.warn(`ML intent recognition failed, using rule-based fallback: ${error.message}`);
        }
      }

      // Fallback to rule-based intent recognition
      return this.ruleBasedIntentRecognition(text);
    } catch (error) {
      this.logger.error(`Error recognizing intents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract entities including medical, temporal, and general entities
   */
  async extractEntities(text: string): Promise<EntityExtractionResult> {
    this.logger.log('Extracting entities from text');

    try {
      // Try ML-based entity extraction first
      if (this.useNLUService) {
        try {
          return await this.mlEntityExtraction(text);
        } catch (error) {
          this.logger.warn(`ML entity extraction failed, using rule-based fallback: ${error.message}`);
        }
      }

      // Fallback to rule-based entity extraction
      return this.ruleBasedEntityExtraction(text);
    } catch (error) {
      this.logger.error(`Error extracting entities: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect emotions from text with sentiment analysis
   */
  async detectEmotions(text: string): Promise<EmotionDetectionResult> {
    this.logger.log('Detecting emotions from text');

    try {
      // Try ML-based emotion detection first
      if (this.useNLUService || this.huggingFaceToken) {
        try {
          return await this.mlEmotionDetection(text);
        } catch (error) {
          this.logger.warn(`ML emotion detection failed, using rule-based fallback: ${error.message}`);
        }
      }

      // Fallback to rule-based emotion detection
      return this.ruleBasedEmotionDetection(text);
    } catch (error) {
      this.logger.error(`Error detecting emotions: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // PRIVATE METHODS - ML-based NLU
  // ============================================

  private async mlIntentRecognition(text: string): Promise<IntentRecognitionResult> {
    try {
      // Try local NLU service first
      const response = await axios.post(
        `${this.nluServiceUrl}/intent`,
        { text },
        { timeout: 5000 }
      );

      return response.data;
    } catch (localError) {
      // Fallback to Hugging Face
      if (this.huggingFaceToken) {
        return await this.huggingFaceIntentRecognition(text);
      }
      throw localError;
    }
  }

  private async huggingFaceIntentRecognition(text: string): Promise<IntentRecognitionResult> {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
      {
        inputs: text,
        parameters: {
          candidate_labels: [
            'emergency help',
            'pain report',
            'medication question',
            'appointment scheduling',
            'vital signs check',
            'activity request',
            'social interaction',
            'reminder',
            'device control',
            'information query',
            'mood expression',
          ],
        },
      },
      {
        headers: { Authorization: `Bearer ${this.huggingFaceToken}` },
        timeout: 10000,
      }
    );

    const labels = response.data.labels;
    const scores = response.data.scores;

    const primaryIntent: Intent = {
      name: this.mapLabelToIntent(labels[0]),
      confidence: scores[0],
    };

    const secondaryIntents: Intent[] = labels
      .slice(1, 3)
      .map((label, idx) => ({
        name: this.mapLabelToIntent(label),
        confidence: scores[idx + 1],
      }))
      .filter(intent => intent.confidence > 0.3);

    return {
      primaryIntent,
      secondaryIntents,
      confidence: scores[0],
      multiIntentDetected: secondaryIntents.length > 0 && secondaryIntents[0].confidence > 0.5,
    };
  }

  private async mlEntityExtraction(text: string): Promise<EntityExtractionResult> {
    try {
      // Try local NLU service
      const response = await axios.post(
        `${this.nluServiceUrl}/entities`,
        { text },
        { timeout: 5000 }
      );

      return response.data;
    } catch (localError) {
      // Fallback to Hugging Face NER
      if (this.huggingFaceToken) {
        return await this.huggingFaceEntityExtraction(text);
      }
      throw localError;
    }
  }

  private async huggingFaceEntityExtraction(text: string): Promise<EntityExtractionResult> {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/dslim/bert-base-NER',
      { inputs: text },
      {
        headers: { Authorization: `Bearer ${this.huggingFaceToken}` },
        timeout: 10000,
      }
    );

    const entities: Entity[] = response.data.map((ent: any) => ({
      type: ent.entity_group,
      value: ent.word,
      start: ent.start,
      end: ent.end,
      confidence: ent.score,
    }));

    // Extract medical entities using rule-based approach
    const medicalEntities = this.extractMedicalEntities(text);
    const temporalEntities = this.extractTemporalEntities(text);

    return {
      entities,
      medicalEntities,
      temporalEntities,
      confidence: entities.length > 0 ? entities[0].confidence : 0.5,
    };
  }

  private async mlEmotionDetection(text: string): Promise<EmotionDetectionResult> {
    try {
      // Try Hugging Face emotion classification
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base',
        { inputs: text },
        {
          headers: { Authorization: `Bearer ${this.huggingFaceToken}` },
          timeout: 10000,
        }
      );

      const emotions: Emotion[] = response.data[0].map((emotion: any) => ({
        name: emotion.label,
        confidence: emotion.score,
        intensity: emotion.score,
      }));

      const primaryEmotion = emotions[0];

      // Determine sentiment
      const positiveEmotions = ['joy', 'happiness', 'love', 'gratitude'];
      const negativeEmotions = ['sadness', 'anger', 'fear', 'disgust', 'anxiety'];

      let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
      if (positiveEmotions.includes(primaryEmotion.name.toLowerCase())) {
        sentiment = 'POSITIVE';
      } else if (negativeEmotions.includes(primaryEmotion.name.toLowerCase())) {
        sentiment = 'NEGATIVE';
      }

      // Determine urgency based on emotions and text
      const urgency = this.determineUrgency(text, emotions);
      const concernFlags = this.identifyConcernFlags(text, emotions);

      return {
        primaryEmotion,
        emotions,
        sentiment,
        urgency,
        concernFlags,
      };
    } catch (error) {
      this.logger.warn(`Hugging Face emotion detection failed: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // PRIVATE METHODS - Rule-based NLU Fallbacks
  // ============================================

  private ruleBasedIntentRecognition(text: string): IntentRecognitionResult {
    const lowerText = text.toLowerCase();
    const intents: Array<{ name: string; confidence: number; pattern: RegExp }> = [];

    // Score each intent pattern
    Object.entries(this.intentPatterns).forEach(([intentName, pattern]) => {
      const match = lowerText.match(pattern);
      if (match) {
        // Calculate confidence based on match strength
        const matchLength = match[0].length;
        const confidence = Math.min(0.6 + (matchLength / text.length) * 0.4, 0.95);
        intents.push({ name: intentName, confidence, pattern });
      }
    });

    // Sort by confidence
    intents.sort((a, b) => b.confidence - a.confidence);

    if (intents.length === 0) {
      // Default to information query
      return {
        primaryIntent: { name: 'INFORMATION', confidence: 0.3 },
        secondaryIntents: [],
        confidence: 0.3,
        multiIntentDetected: false,
      };
    }

    const primaryIntent: Intent = {
      name: intents[0].name,
      confidence: intents[0].confidence,
    };

    const secondaryIntents: Intent[] = intents
      .slice(1, 3)
      .filter(i => i.confidence > 0.4)
      .map(i => ({
        name: i.name,
        confidence: i.confidence,
      }));

    return {
      primaryIntent,
      secondaryIntents,
      confidence: intents[0].confidence,
      multiIntentDetected: secondaryIntents.length > 0 && secondaryIntents[0].confidence > 0.5,
    };
  }

  private ruleBasedEntityExtraction(text: string): EntityExtractionResult {
    const lowerText = text.toLowerCase();

    // Extract general entities (numbers, dates, times)
    const entities: Entity[] = [];

    // Extract numbers
    const numberMatches = text.matchAll(/\b(\d+(?:\.\d+)?)\b/g);
    for (const match of numberMatches) {
      entities.push({
        type: 'NUMBER',
        value: match[1],
        start: match.index!,
        end: match.index! + match[1].length,
        confidence: 0.9,
      });
    }

    // Extract medical entities
    const medicalEntities = this.extractMedicalEntities(text);

    // Extract temporal entities
    const temporalEntities = this.extractTemporalEntities(text);

    return {
      entities,
      medicalEntities,
      temporalEntities,
      confidence: 0.7,
    };
  }

  private extractMedicalEntities(text: string): MedicalEntity[] {
    const lowerText = text.toLowerCase();
    const medicalEntities: MedicalEntity[] = [];

    // Extract symptoms
    this.medicalTerms.symptoms.forEach(symptom => {
      const regex = new RegExp(`\\b${symptom}s?\\b`, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        medicalEntities.push({
          type: 'SYMPTOM',
          value: match[0],
          normalized: symptom,
          severity: this.inferSymptomSeverity(text, symptom),
          confidence: 0.8,
        });
      }
    });

    // Extract body parts
    this.medicalTerms.bodyParts.forEach(bodyPart => {
      const regex = new RegExp(`\\b${bodyPart}s?\\b`, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        medicalEntities.push({
          type: 'BODY_PART',
          value: match[0],
          normalized: bodyPart,
          confidence: 0.85,
        });
      }
    });

    // Extract medications
    this.medicalTerms.medications.forEach(medication => {
      const regex = new RegExp(`\\b${medication}\\b`, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        medicalEntities.push({
          type: 'MEDICATION',
          value: match[0],
          normalized: medication,
          confidence: 0.9,
        });
      }
    });

    // Extract conditions
    this.medicalTerms.conditions.forEach(condition => {
      const regex = new RegExp(`\\b${condition}\\b`, 'gi');
      const matches = text.matchAll(regex);
      for (const match of matches) {
        medicalEntities.push({
          type: 'CONDITION',
          value: match[0],
          normalized: condition,
          confidence: 0.85,
        });
      }
    });

    return medicalEntities;
  }

  private extractTemporalEntities(text: string): TemporalEntity[] {
    const temporalEntities: TemporalEntity[] = [];

    // Duration patterns
    const durationPatterns = [
      { pattern: /(\d+)\s*(hour|hr|hours|hrs)/gi, unit: 'hours' },
      { pattern: /(\d+)\s*(minute|min|minutes|mins)/gi, unit: 'minutes' },
      { pattern: /(\d+)\s*(day|days)/gi, unit: 'days' },
      { pattern: /(\d+)\s*(week|weeks)/gi, unit: 'weeks' },
      { pattern: /(\d+)\s*(month|months)/gi, unit: 'months' },
    ];

    durationPatterns.forEach(({ pattern, unit }) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        temporalEntities.push({
          type: 'DURATION',
          value: match[0],
          normalized: `${match[1]} ${unit}`,
          confidence: 0.85,
        });
      }
    });

    // Frequency patterns
    const frequencyPatterns = [
      /\b(daily|every day)\b/gi,
      /\b(twice|two times)\s*a\s*day\b/gi,
      /\b(weekly|every week)\b/gi,
      /\b(monthly|every month)\b/gi,
      /\b(\d+)\s*times?\s*a\s*(day|week|month)\b/gi,
    ];

    frequencyPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        temporalEntities.push({
          type: 'FREQUENCY',
          value: match[0],
          normalized: match[0].toLowerCase(),
          confidence: 0.8,
        });
      }
    });

    // Relative time
    const relativeTimePatterns = [
      /\b(today|tonight|now)\b/gi,
      /\b(yesterday|last night)\b/gi,
      /\b(tomorrow|next week|next month)\b/gi,
      /\b(this morning|this afternoon|this evening)\b/gi,
    ];

    relativeTimePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        temporalEntities.push({
          type: 'TIME',
          value: match[0],
          normalized: match[0].toLowerCase(),
          confidence: 0.9,
        });
      }
    });

    return temporalEntities;
  }

  private ruleBasedEmotionDetection(text: string): EmotionDetectionResult {
    const lowerText = text.toLowerCase();
    const emotions: Emotion[] = [];

    // Emotion keywords mapping
    const emotionKeywords = {
      joy: ['happy', 'joy', 'great', 'wonderful', 'excited', 'good', 'fine', 'well'],
      sadness: ['sad', 'unhappy', 'down', 'depressed', 'crying', 'tears', 'miss'],
      anxiety: ['worried', 'anxious', 'nervous', 'scared', 'afraid', 'panic', 'stress'],
      anger: ['angry', 'mad', 'furious', 'upset', 'irritated', 'annoyed'],
      fear: ['fear', 'frightened', 'terrified', 'afraid', 'scared'],
      pain: ['pain', 'hurt', 'ache', 'discomfort', 'agony'],
    };

    // Score emotions
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          score += 0.2;
        }
      });
      if (score > 0) {
        emotions.push({
          name: emotion,
          confidence: Math.min(score, 1.0),
          intensity: Math.min(score, 1.0),
        });
      }
    });

    // Sort by confidence
    emotions.sort((a, b) => b.confidence - a.confidence);

    const primaryEmotion = emotions.length > 0
      ? emotions[0]
      : { name: 'neutral', confidence: 0.5, intensity: 0.5 };

    // Determine sentiment
    const positiveEmotions = ['joy', 'happiness', 'love'];
    const negativeEmotions = ['sadness', 'anger', 'fear', 'anxiety', 'pain'];

    let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
    if (positiveEmotions.includes(primaryEmotion.name)) {
      sentiment = 'POSITIVE';
    } else if (negativeEmotions.includes(primaryEmotion.name)) {
      sentiment = 'NEGATIVE';
    }

    const urgency = this.determineUrgency(text, emotions);
    const concernFlags = this.identifyConcernFlags(text, emotions);

    return {
      primaryEmotion,
      emotions,
      sentiment,
      urgency,
      concernFlags,
    };
  }

  // ============================================
  // PRIVATE METHODS - Helper Functions
  // ============================================

  private mapLabelToIntent(label: string): string {
    const mapping: Record<string, string> = {
      'emergency help': 'EMERGENCY',
      'pain report': 'PAIN_REPORT',
      'medication question': 'MEDICATION_QUERY',
      'appointment scheduling': 'APPOINTMENT',
      'vital signs check': 'VITALS_CHECK',
      'activity request': 'ACTIVITY_REQUEST',
      'social interaction': 'SOCIAL_INTERACTION',
      'reminder': 'REMINDER',
      'device control': 'DEVICE_CONTROL',
      'information query': 'INFORMATION',
      'mood expression': 'MOOD_EXPRESSION',
    };
    return mapping[label] || 'UNKNOWN';
  }

  private inferSymptomSeverity(text: string, symptom: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const lowerText = text.toLowerCase();

    // Critical indicators
    if (lowerText.includes('severe') || lowerText.includes('intense') || lowerText.includes('unbearable') || lowerText.includes('worst')) {
      return 'CRITICAL';
    }

    // High severity
    if (lowerText.includes('bad') || lowerText.includes('serious') || lowerText.includes('strong') || lowerText.includes('can\'t')) {
      return 'HIGH';
    }

    // Medium severity
    if (lowerText.includes('moderate') || lowerText.includes('uncomfortable') || lowerText.includes('bothering')) {
      return 'MEDIUM';
    }

    // Low severity
    return 'LOW';
  }

  private determineUrgency(text: string, emotions: Emotion[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const lowerText = text.toLowerCase();

    // Critical urgency indicators
    const criticalKeywords = ['emergency', 'help', 'urgent', 'critical', 'can\'t breathe', 'chest pain', 'stroke', 'heart attack', 'falling', 'fell'];
    if (criticalKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'CRITICAL';
    }

    // High urgency indicators
    const highKeywords = ['pain', 'severe', 'dizzy', 'confused', 'bleeding', 'nausea'];
    if (highKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'HIGH';
    }

    // Check emotional intensity
    const highIntensityEmotions = emotions.filter(e => e.intensity > 0.7 && ['fear', 'anxiety', 'pain'].includes(e.name));
    if (highIntensityEmotions.length > 0) {
      return 'HIGH';
    }

    // Medium urgency
    const mediumKeywords = ['worried', 'concerned', 'uncomfortable', 'not feeling well'];
    if (mediumKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private identifyConcernFlags(text: string, emotions: Emotion[]): string[] {
    const lowerText = text.toLowerCase();
    const flags: string[] = [];

    // Depression indicators
    if (lowerText.includes('lonely') || lowerText.includes('alone') || lowerText.includes('no one cares') || lowerText.includes('depressed')) {
      flags.push('DEPRESSION_INDICATOR');
    }

    // Cognitive decline indicators
    if (lowerText.includes('forgot') || lowerText.includes('can\'t remember') || lowerText.includes('confused') || lowerText.includes('disoriented')) {
      flags.push('COGNITIVE_CONCERN');
    }

    // Pain indicators
    if (lowerText.includes('pain') || lowerText.includes('hurt') || lowerText.includes('ache')) {
      flags.push('PAIN_REPORTED');
    }

    // Medication non-adherence
    if (lowerText.includes('forgot medication') || lowerText.includes('missed pill') || lowerText.includes('didn\'t take')) {
      flags.push('MEDICATION_ADHERENCE_ISSUE');
    }

    // Social isolation
    const sadnessEmotion = emotions.find(e => e.name === 'sadness');
    if (sadnessEmotion && sadnessEmotion.intensity > 0.6) {
      flags.push('EMOTIONAL_DISTRESS');
    }

    // Anxiety or fear
    const anxietyEmotion = emotions.find(e => ['anxiety', 'fear'].includes(e.name));
    if (anxietyEmotion && anxietyEmotion.intensity > 0.7) {
      flags.push('HIGH_ANXIETY');
    }

    return flags;
  }

  private generateSuggestions(
    intents: IntentRecognitionResult,
    entities: EntityExtractionResult,
    emotions: EmotionDetectionResult
  ): string[] {
    const suggestions: string[] = [];

    // Suggestions based on intent
    switch (intents.primaryIntent.name) {
      case 'EMERGENCY':
        suggestions.push('Initiate emergency protocol');
        suggestions.push('Contact emergency services');
        suggestions.push('Alert family members');
        break;
      case 'PAIN_REPORT':
        suggestions.push('Log pain in health record');
        suggestions.push('Assess pain severity');
        suggestions.push('Suggest pain management options');
        break;
      case 'MEDICATION_QUERY':
        suggestions.push('Review medication schedule');
        suggestions.push('Check medication interactions');
        suggestions.push('Set medication reminder');
        break;
      case 'SOCIAL_INTERACTION':
        suggestions.push('Schedule video call with family');
        suggestions.push('Suggest social activities');
        suggestions.push('Connect with companion service');
        break;
      case 'MOOD_EXPRESSION':
        if (emotions.sentiment === 'NEGATIVE') {
          suggestions.push('Provide emotional support');
          suggestions.push('Suggest relaxation techniques');
          suggestions.push('Alert care team if persistent');
        }
        break;
    }

    // Suggestions based on concern flags
    if (emotions.concernFlags.includes('DEPRESSION_INDICATOR')) {
      suggestions.push('Alert mental health professional');
      suggestions.push('Increase social engagement');
    }

    if (emotions.concernFlags.includes('COGNITIVE_CONCERN')) {
      suggestions.push('Schedule cognitive assessment');
      suggestions.push('Increase monitoring frequency');
    }

    return suggestions;
  }

  // ============================================
  // PRIVATE METHODS - Data Storage & Alerts
  // ============================================

  private async storeNLUAnalysis(
    elderId: string,
    text: string,
    intents: IntentRecognitionResult,
    entities: EntityExtractionResult,
    emotions: EmotionDetectionResult
  ) {
    try {
      await this.prisma.companionConversation.create({
        data: {
          elderId,
          userMessage: text,
          companionResponse: 'Processing...',
          sentiment: emotions.sentiment,
          actionTriggered: {
            intents: intents.primaryIntent.name,
            urgency: emotions.urgency,
            concernFlags: emotions.concernFlags,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to store NLU analysis: ${error.message}`);
    }
  }

  private async handleUrgentSituation(
    elderId: string,
    text: string,
    intents: IntentRecognitionResult,
    emotions: EmotionDetectionResult
  ) {
    if (!elderId) return;

    this.logger.warn(`Urgent situation detected for elder ${elderId}: ${intents.primaryIntent.name}`);

    try {
      // Create critical alert
      await this.prisma.alert.create({
        data: {
          elderId,
          type: 'VITAL_ABNORMAL', // Use closest available type
          severity: 'CRITICAL',
          title: `Urgent ${intents.primaryIntent.name} Detected`,
          message: text,
          metadata: {
            intent: intents.primaryIntent.name,
            urgency: emotions.urgency,
            concernFlags: emotions.concernFlags,
            emotions: emotions.primaryEmotion,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create urgent alert: ${error.message}`);
    }
  }
}
