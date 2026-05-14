import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/logging/logger.service';
import { PrismaService } from '../common/prisma/prisma.service';
import Stripe from 'stripe';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
    private prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY not configured - payment processing disabled',
        'PaymentService',
      );
      // Create a dummy instance to prevent errors
      this.stripe = null as any;
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-11-20.acacia',
      });
      this.logger.log('Stripe initialized successfully', 'PaymentService');
    }
  }

  /**
   * Create payment intent for booking
   */
  async createPaymentIntent(data: {
    amount: number; // in cents
    currency?: string;
    bookingId?: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    this.ensureStripeInitialized();

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency || 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          bookingId: data.bookingId || '',
          ...data.metadata,
        },
      });

      this.logger.logEvent('Payment intent created', 'PaymentIntent', paymentIntent.id, {
        amount: data.amount,
        currency: data.currency || 'usd',
        bookingId: data.bookingId,
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!,
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent', '', 'PaymentService', {
        error: (error as Error).message,
        amount: data.amount,
      });
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Retrieve payment intent
   */
  async getPaymentIntent(paymentIntentId: string) {
    this.ensureStripeInitialized();

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve payment intent', '', 'PaymentService', {
        error: (error as Error).message,
        paymentIntentId,
      });
      throw new BadRequestException('Payment intent not found');
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
  ) {
    this.ensureStripeInitialized();

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethodId,
        },
      );

      this.logger.logEvent('Payment confirmed', 'PaymentIntent', paymentIntentId, {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      });

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error) {
      this.logger.error('Failed to confirm payment', '', 'PaymentService', {
        error: (error as Error).message,
        paymentIntentId,
      });
      throw new BadRequestException('Failed to confirm payment');
    }
  }

  /**
   * Cancel payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string) {
    this.ensureStripeInitialized();

    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);

      this.logger.logEvent('Payment cancelled', 'PaymentIntent', paymentIntentId, {});

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error('Failed to cancel payment', '', 'PaymentService', {
        error: (error as Error).message,
        paymentIntentId,
      });
      throw new BadRequestException('Failed to cancel payment');
    }
  }

  /**
   * Create customer in Stripe
   */
  async createCustomer(data: {
    email: string;
    name: string;
    phone?: string;
    metadata?: Record<string, string>;
  }) {
    this.ensureStripeInitialized();

    try {
      const customer = await this.stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: data.metadata,
      });

      this.logger.logEvent('Stripe customer created', 'Customer', customer.id, {
        email: data.email,
      });

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      };
    } catch (error) {
      this.logger.error('Failed to create customer', '', 'PaymentService', {
        error: (error as Error).message,
        email: data.email,
      });
      throw new BadRequestException('Failed to create customer');
    }
  }

  /**
   * Get customer
   */
  async getCustomer(customerId: string) {
    this.ensureStripeInitialized();

    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new BadRequestException('Customer has been deleted');
      }

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: customer.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve customer', '', 'PaymentService', {
        error: (error as Error).message,
        customerId,
      });
      throw new BadRequestException('Customer not found');
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    this.ensureStripeInitialized();

    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        {
          customer: customerId,
        },
      );

      this.logger.logEvent('Payment method attached', 'PaymentMethod', paymentMethodId, {
        customerId,
      });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        } : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to attach payment method', '', 'PaymentService', {
        error: (error as Error).message,
        paymentMethodId,
        customerId,
      });
      throw new BadRequestException('Failed to attach payment method');
    }
  }

  /**
   * List customer payment methods
   */
  async listPaymentMethods(customerId: string) {
    this.ensureStripeInitialized();

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : undefined,
      }));
    } catch (error) {
      this.logger.error('Failed to list payment methods', '', 'PaymentService', {
        error: (error as Error).message,
        customerId,
      });
      throw new BadRequestException('Failed to list payment methods');
    }
  }

  /**
   * Detach payment method
   */
  async detachPaymentMethod(paymentMethodId: string) {
    this.ensureStripeInitialized();

    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);

      this.logger.logEvent('Payment method detached', 'PaymentMethod', paymentMethodId, {});

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to detach payment method', '', 'PaymentService', {
        error: (error as Error).message,
        paymentMethodId,
      });
      throw new BadRequestException('Failed to detach payment method');
    }
  }

  /**
   * Create refund
   */
  async createRefund(data: {
    paymentIntentId: string;
    amount?: number; // Partial refund amount in cents
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }) {
    this.ensureStripeInitialized();

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: data.paymentIntentId,
        amount: data.amount,
        reason: data.reason,
      });

      this.logger.logEvent('Refund created', 'Refund', refund.id, {
        paymentIntentId: data.paymentIntentId,
        amount: refund.amount,
        status: refund.status,
      });

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason,
      };
    } catch (error) {
      this.logger.error('Failed to create refund', '', 'PaymentService', {
        error: (error as Error).message,
        paymentIntentId: data.paymentIntentId,
      });
      throw new BadRequestException('Failed to create refund');
    }
  }

  /**
   * Get payment history for customer
   */
  async getPaymentHistory(customerId: string, limit = 10) {
    this.ensureStripeInitialized();

    try {
      const paymentIntents = await this.stripe.paymentIntents.list({
        customer: customerId,
        limit,
      });

      return paymentIntents.data.map(pi => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: new Date(pi.created * 1000),
        metadata: pi.metadata,
      }));
    } catch (error) {
      this.logger.error('Failed to retrieve payment history', '', 'PaymentService', {
        error: (error as Error).message,
        customerId,
      });
      throw new BadRequestException('Failed to retrieve payment history');
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      this.logger.debug('Stripe webhook received', 'PaymentService', {
        type: event.type,
        id: event.id,
      });

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
          break;

        case 'customer.created':
          this.logger.logEvent('Customer created via webhook', 'Customer', event.data.object.id, {});
          break;

        default:
          this.logger.debug('Unhandled webhook event', 'PaymentService', {
            type: event.type,
          });
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook verification failed', '', 'PaymentService', {
        error: (error as Error).message,
      });
      throw new BadRequestException('Webhook verification failed');
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.logEvent('Payment succeeded', 'PaymentIntent', paymentIntent.id, {
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

    // Update booking status if bookingId is in metadata
    const bookingId = paymentIntent.metadata?.bookingId;
    if (bookingId) {
      try {
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CONFIRMED',
            notes: `Payment confirmed: ${paymentIntent.id}`,
          },
        });

        this.logger.logEvent('Booking confirmed after payment', 'Booking', bookingId, {
          paymentIntentId: paymentIntent.id,
        });
      } catch (error) {
        this.logger.error('Failed to update booking status', '', 'PaymentService', {
          error: (error as Error).message,
          bookingId,
        });
      }
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.logSecurity('Payment failed', 'medium', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      lastPaymentError: paymentIntent.last_payment_error?.message,
    });

    // TODO: Send notification to user about failed payment
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    this.logger.logEvent('Payment canceled', 'PaymentIntent', paymentIntent.id, {
      amount: paymentIntent.amount,
    });

    // Update booking status if bookingId is in metadata
    const bookingId = paymentIntent.metadata?.bookingId;
    if (bookingId) {
      try {
        await this.prisma.booking.update({
          where: { id: bookingId },
          data: {
            notes: `Payment canceled: ${paymentIntent.id}`,
          },
        });
      } catch (error) {
        this.logger.error('Failed to update booking after cancellation', '', 'PaymentService', {
          error: (error as Error).message,
          bookingId,
        });
      }
    }
  }

  /**
   * Ensure Stripe is initialized
   */
  private ensureStripeInitialized() {
    if (!this.stripe) {
      throw new BadRequestException(
        'Payment processing is not configured. Please contact support.',
      );
    }
  }

  /**
   * Get Stripe public key for client-side
   */
  getPublicKey(): string {
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || '';
  }
}
