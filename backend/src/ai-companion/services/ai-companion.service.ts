import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerService } from '../../common/logging/logger.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface CompanionPersonality {
  name: string;
  age?: number;
  gender?: string;
  traits: string[];
  background?: string;
  communicationStyle: string;
}

@Injectable()
export class AICompanionService {
  private readonly defaultPersonality: CompanionPersonality = {
    name: 'Emma',
    age: 45,
    gender: 'female',
    traits: [
      'warm and caring',
      'patient and understanding',
      'good listener',
      'encouraging',
      'empathetic',
      'respectful',
      'knowledgeable about elder care',
    ],
    background: 'experienced caregiver who loves helping seniors maintain their independence',
    communicationStyle: 'friendly, clear, and simple language; speaks slowly and repeats when needed',
  };

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private config: ConfigService,
  ) {}

  /**
   * Send message to AI companion and get response
   */
  async chat(elderId: string, userMessage: string): Promise<any> {
    this.logger.logEvent('AI companion chat', 'AICompanion', elderId, {
      messageLength: userMessage.length,
    });

    // Get elder profile and companion settings
    const elder = await this.prisma.elder.findUnique({
      where: { id: elderId },
      include: {
        medications: {
          where: { status: 'ACTIVE' },
          take: 5,
        },
        appointments: {
          where: {
            scheduledAt: {
              gte: new Date(),
            },
          },
          take: 5,
          orderBy: { scheduledAt: 'asc' },
        },
        companionSettings: true,
        emergencyContacts: {
          where: { active: true },
          take: 3,
        },
      },
    });

    if (!elder) {
      throw new Error('Elder profile not found');
    }

    // Get or create companion settings
    const settings = elder.companionSettings || (await this.createDefaultSettings(elderId));

    // Build conversation context
    const context = await this.buildConversationContext(elder, settings);

    // Get recent conversation history
    const recentMessages = await this.getRecentMessages(elderId, 10);

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(elder, settings, context);

    // Prepare messages for LLM
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
      { role: 'user', content: userMessage },
    ];

    // Get AI response
    const aiResponse = await this.getAIResponse(messages);

    // Save conversation
    await this.saveConversation(elderId, userMessage, aiResponse);

    // Check if AI wants to trigger any actions
    const actions = await this.detectAndExecuteActions(elderId, aiResponse, elder);

    return {
      response: aiResponse,
      actions,
      companionName: settings.personalityName || this.defaultPersonality.name,
    };
  }

  /**
   * Build system prompt with elder context
   */
  private buildSystemPrompt(elder: any, settings: any, context: any): string {
    const personality = settings.personalityName || this.defaultPersonality.name;
    const traits = settings.personalityTraits || this.defaultPersonality.traits.join(', ');

    return `You are ${personality}, a warm and caring AI companion for ${elder.firstName} ${elder.lastName}, an elderly person who needs daily support and companionship.

Your personality: ${traits}

Your role:
- Be a caring friend and companion
- Help with daily tasks and reminders
- Provide emotional support and encouragement
- Keep conversations simple, clear, and positive
- Be patient and repeat information when needed
- Show genuine interest and care

Communication style:
- Use simple, clear language
- Speak in short sentences
- Be warm and friendly
- Use the elder's first name (${elder.firstName})
- Be encouraging and positive
- Don't use medical jargon

Current context about ${elder.firstName}:
- Age: ${elder.dateOfBirth ? Math.floor((Date.now() - new Date(elder.dateOfBirth).getTime()) / 31557600000) : 'not specified'}
- Current medications: ${context.medications.length > 0 ? context.medications.map(m => m.medicationName).join(', ') : 'none listed'}
- Upcoming appointments: ${context.appointments.length > 0 ? context.appointments.map(a => `${a.appointmentType} on ${new Date(a.scheduledAt).toLocaleDateString()}`).join('; ') : 'none scheduled'}
- Family contacts: ${context.familyContacts.length > 0 ? context.familyContacts.map(c => `${c.name} (${c.relationship})`).join(', ') : 'none listed'}
- Medical conditions: ${elder.medicalConditions || 'none listed'}

Important capabilities:
- If ${elder.firstName} needs a medication reminder, acknowledge and offer to help
- If they mention forgetting appointments, gently remind them
- If they seem lonely or sad, provide companionship and suggest activities
- If they want to call family, encourage them and offer assistance
- If they mention not feeling well, show concern and suggest they seek help
- If they mention exercise, encourage them and suggest gentle activities
- If there's an emergency, immediately advise them to call for help

Guidelines:
- NEVER provide medical advice or diagnosis
- NEVER suggest changing medications without doctor approval
- ALWAYS encourage them to consult healthcare providers for health issues
- Be supportive but direct them to appropriate help when needed
- Keep responses concise (2-4 sentences usually)
- Show empathy and understanding

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Current time: ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}

Remember: You're here to be a caring companion and helper, not a medical professional. Be warm, supportive, and helpful while keeping ${elder.firstName} safe and connected.`;
  }

  /**
   * Build conversation context from elder data
   */
  private async buildConversationContext(elder: any, settings: any): Promise<any> {
    return {
      medications: elder.medications.map((med) => ({
        medicationName: med.medicationName,
        dosage: med.dosage,
        frequency: med.frequency,
        nextDose: this.calculateNextDose(med),
      })),
      appointments: elder.appointments.map((apt) => ({
        appointmentType: apt.appointmentType,
        provider: apt.provider,
        scheduledAt: apt.scheduledAt,
        location: apt.location,
      })),
      familyContacts: elder.emergencyContacts.map((contact) => ({
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
      })),
      todaysTasks: await this.getTodaysTasks(elder.id),
      recentVitals: await this.getRecentVitals(elder.id),
    };
  }

  /**
   * Get AI response from LLM API
   */
  private async getAIResponse(messages: Message[]): Promise<string> {
    // Use OpenAI API (can be replaced with Claude API, local LLM, etc.)
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      // Fallback response if API key not configured
      return this.generateFallbackResponse(messages[messages.length - 1].content);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4', // or 'gpt-3.5-turbo' for faster/cheaper
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: 0.7,
          max_tokens: 200, // Keep responses concise
          presence_penalty: 0.6,
          frequency_penalty: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.logError('AI API call failed', error, {});

      // Fallback to rule-based response
      return this.generateFallbackResponse(messages[messages.length - 1].content);
    }
  }

  /**
   * Generate fallback response when AI API unavailable
   */
  private generateFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Medication reminders
    if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('pill')) {
      return "I'm here to help you remember your medications! Let me check your schedule. Would you like me to show you what medicines you need to take today?";
    }

    // Appointments
    if (lowerMessage.includes('appointment') || lowerMessage.includes('doctor') || lowerMessage.includes('visit')) {
      return "I can help you keep track of your appointments. Let me check what you have coming up. Would you like to see your appointment schedule?";
    }

    // Family calls
    if (lowerMessage.includes('call') || lowerMessage.includes('family') || lowerMessage.includes('son') || lowerMessage.includes('daughter')) {
      return "It's wonderful that you want to connect with your family! I can help you reach out to them. Who would you like to call?";
    }

    // Loneliness/sadness
    if (lowerMessage.includes('lonely') || lowerMessage.includes('sad') || lowerMessage.includes('miss')) {
      return "I'm here with you, and I care about how you're feeling. It's okay to feel this way. Would you like to chat for a while, or maybe call a family member to brighten your day?";
    }

    // Not feeling well
    if (lowerMessage.includes('hurt') || lowerMessage.includes('pain') || lowerMessage.includes('sick') || lowerMessage.includes('feel')) {
      return "I'm concerned about how you're feeling. If you're experiencing pain or feeling unwell, it's important to get help. Can I help you contact your doctor or a family member?";
    }

    // Exercise
    if (lowerMessage.includes('exercise') || lowerMessage.includes('walk') || lowerMessage.includes('active')) {
      return "That's wonderful that you're thinking about staying active! Gentle exercise is so important. Would you like some suggestions for safe, easy exercises you can do?";
    }

    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm so glad to chat with you today. How are you feeling? Is there anything I can help you with?";
    }

    // Thanks
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're very welcome! I'm always here to help. Is there anything else you'd like to talk about or need assistance with?";
    }

    // Default
    return "I'm here to help and keep you company. I can remind you about medications, appointments, and help you stay connected with family. What would you like to talk about?";
  }

  /**
   * Detect actions in AI response and execute them
   */
  private async detectAndExecuteActions(elderId: string, response: string, elder: any): Promise<any[]> {
    const actions = [];

    // Detect medication reminder trigger
    if (response.toLowerCase().includes('medication') || response.toLowerCase().includes('medicine')) {
      const upcomingMeds = await this.checkUpcomingMedications(elderId);
      if (upcomingMeds.length > 0) {
        actions.push({
          type: 'MEDICATION_REMINDER',
          data: upcomingMeds,
        });
      }
    }

    // Detect appointment reminder trigger
    if (response.toLowerCase().includes('appointment')) {
      const upcomingAppointments = await this.checkUpcomingAppointments(elderId);
      if (upcomingAppointments.length > 0) {
        actions.push({
          type: 'APPOINTMENT_REMINDER',
          data: upcomingAppointments,
        });
      }
    }

    // Detect family call suggestion
    if (response.toLowerCase().includes('call') && response.toLowerCase().includes('family')) {
      const familyContacts = elder.emergencyContacts.filter(c => c.active);
      if (familyContacts.length > 0) {
        actions.push({
          type: 'SUGGEST_CALL',
          data: familyContacts,
        });
      }
    }

    // Detect exercise suggestion
    if (response.toLowerCase().includes('exercise') || response.toLowerCase().includes('activity')) {
      actions.push({
        type: 'SUGGEST_EXERCISE',
        data: await this.getExerciseSuggestions(elder),
      });
    }

    return actions;
  }

  /**
   * Save conversation to database
   */
  private async saveConversation(elderId: string, userMessage: string, aiResponse: string) {
    await this.prisma.companionConversation.create({
      data: {
        elderId,
        userMessage,
        companionResponse: aiResponse,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Get recent messages for context
   */
  private async getRecentMessages(elderId: string, limit: number): Promise<Message[]> {
    const conversations = await this.prisma.companionConversation.findMany({
      where: { elderId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return conversations
      .reverse()
      .flatMap((conv) => [
        { role: 'user' as const, content: conv.userMessage, timestamp: conv.timestamp },
        { role: 'assistant' as const, content: conv.companionResponse, timestamp: conv.timestamp },
      ]);
  }

  /**
   * Create default companion settings
   */
  private async createDefaultSettings(elderId: string) {
    return this.prisma.companionSettings.create({
      data: {
        elderId,
        enabled: true,
        personalityName: this.defaultPersonality.name,
        personalityTraits: this.defaultPersonality.traits,
        voiceEnabled: true,
        proactiveReminders: true,
        emotionalSupport: true,
        conversationHistory: true,
      },
    });
  }

  /**
   * Check upcoming medications
   */
  private async checkUpcomingMedications(elderId: string) {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

    const medications = await this.prisma.medication.findMany({
      where: {
        elderId,
        status: 'ACTIVE',
      },
      include: {
        doses: {
          where: {
            scheduledAt: {
              gte: now,
              lte: nextHour,
            },
            status: 'PENDING',
          },
        },
      },
    });

    return medications.filter((med) => med.doses.length > 0);
  }

  /**
   * Check upcoming appointments
   */
  private async checkUpcomingAppointments(elderId: string) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.appointment.findMany({
      where: {
        elderId,
        scheduledAt: {
          gte: now,
          lte: tomorrow,
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  /**
   * Get today's care tasks
   */
  private async getTodaysTasks(elderId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.careTask.findMany({
      where: {
        elderId,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'COMPLETED',
        },
      },
    });
  }

  /**
   * Get recent vital readings
   */
  private async getRecentVitals(elderId: string) {
    return this.prisma.vitalReading.findMany({
      where: { elderId },
      orderBy: { recordedAt: 'desc' },
      take: 5,
    });
  }

  /**
   * Calculate next medication dose time
   */
  private calculateNextDose(medication: any): Date | null {
    // Simple calculation - would be more complex in reality
    const now = new Date();
    const nextDose = new Date(now);

    // Parse frequency (e.g., "twice daily", "every 8 hours")
    if (medication.frequency.includes('daily')) {
      nextDose.setHours(nextDose.getHours() + 12);
    } else if (medication.frequency.includes('8 hours')) {
      nextDose.setHours(nextDose.getHours() + 8);
    }

    return nextDose;
  }

  /**
   * Get exercise suggestions based on elder capabilities
   */
  private async getExerciseSuggestions(elder: any) {
    // Simple suggestions - would be personalized in reality
    return [
      {
        name: 'Gentle Walking',
        duration: '10-15 minutes',
        description: 'A short walk around your home or neighborhood',
      },
      {
        name: 'Seated Stretches',
        duration: '5-10 minutes',
        description: 'Gentle stretching while sitting in a chair',
      },
      {
        name: 'Arm Circles',
        duration: '2-3 minutes',
        description: 'Slowly rotate your arms in circles',
      },
    ];
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(elderId: string, days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const conversations = await this.prisma.companionConversation.findMany({
      where: {
        elderId,
        timestamp: {
          gte: startDate,
        },
      },
    });

    return {
      totalConversations: conversations.length,
      averagePerDay: conversations.length / days,
      lastConversation: conversations.length > 0 ? conversations[conversations.length - 1].timestamp : null,
    };
  }

  /**
   * Send proactive reminder
   */
  async sendProactiveReminder(elderId: string, type: string, data: any) {
    const settings = await this.prisma.companionSettings.findUnique({
      where: { elderId },
    });

    if (!settings || !settings.proactiveReminders) {
      return null;
    }

    let message = '';
    switch (type) {
      case 'MEDICATION':
        message = `Hi! It's time to take your medication: ${data.medicationName}. The dosage is ${data.dosage}. Don't forget!`;
        break;
      case 'APPOINTMENT':
        message = `Just a friendly reminder - you have a ${data.appointmentType} appointment tomorrow at ${new Date(data.scheduledAt).toLocaleTimeString()}.`;
        break;
      case 'EXERCISE':
        message = `Good morning! How about some gentle exercise today? Even a short walk can make you feel great!`;
        break;
      case 'CHECK_IN':
        message = `Hello! Just checking in on you. How are you feeling today?`;
        break;
    }

    const response = await this.chat(elderId, message);

    return {
      type,
      message,
      response,
    };
  }
}
