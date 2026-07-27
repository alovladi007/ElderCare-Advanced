import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentService } from './payment.service';
import { LoggerService } from '../common/logging/logger.service';
import { PrismaService } from '../common/prisma/prisma.service';

jest.mock('stripe');

/**
 * The Stripe SDK's typed methods are plain function signatures, so
 * `jest.Mocked<Stripe>` does not expose `mockResolvedValue`. We build a plain
 * object of jest.fn()s instead and cast it to `Stripe` at the injection point.
 */
interface StripeMock {
  paymentIntents: {
    create: jest.Mock;
    retrieve: jest.Mock;
    confirm: jest.Mock;
    cancel: jest.Mock;
    list: jest.Mock;
  };
  customers: {
    create: jest.Mock;
    retrieve: jest.Mock;
  };
  paymentMethods: {
    attach: jest.Mock;
    list: jest.Mock;
    detach: jest.Mock;
  };
  refunds: {
    create: jest.Mock;
  };
  webhooks: {
    constructEvent: jest.Mock;
  };
}

const createStripeMock = (): StripeMock => ({
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
    list: jest.fn(),
  },
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  paymentMethods: {
    attach: jest.fn(),
    list: jest.fn(),
    detach: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
});

describe('PaymentService', () => {
  let service: PaymentService;
  let stripeMock: StripeMock;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    booking: {
      update: jest.fn(),
    },
  };

  const mockLoggerService = {
    log: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logEvent: jest.fn(),
    logSecurity: jest.fn(),
  };

  const config: Record<string, string | undefined> = {
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
  };

  const buildService = async (): Promise<PaymentService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    return module.get<PaymentService>(PaymentService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // The service reads STRIPE_SECRET_KEY in its constructor, so the config
    // mock must be primed *before* the testing module is compiled.
    config.STRIPE_SECRET_KEY = 'sk_test_123';
    config.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    mockConfigService.get.mockImplementation((key: string) => config[key]);

    stripeMock = createStripeMock();
    (Stripe as unknown as jest.Mock).mockImplementation(
      () => stripeMock as unknown as Stripe,
    );

    service = await buildService();
  });

  describe('constructor / ensureStripeInitialized', () => {
    it('disables payment processing and warns when STRIPE_SECRET_KEY is absent', async () => {
      config.STRIPE_SECRET_KEY = undefined;

      const unconfigured = await buildService();

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'STRIPE_SECRET_KEY not configured - payment processing disabled',
        'PaymentService',
      );
      await expect(unconfigured.createPaymentIntent({ amount: 5000 })).rejects.toThrow(
        'Payment processing is not configured. Please contact support.',
      );
      expect(stripeMock.paymentIntents.create).not.toHaveBeenCalled();
    });
  });

  describe('createPaymentIntent', () => {
    it('defaults currency to usd and sends an empty bookingId when none is given', async () => {
      stripeMock.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        amount: 5000,
        currency: 'usd',
        status: 'requires_payment_method',
        client_secret: 'pi_123_secret_456',
      });

      const result = await service.createPaymentIntent({ amount: 5000 });

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: { bookingId: '' },
      });
      expect(result).toEqual({
        id: 'pi_123',
        amount: 5000,
        currency: 'usd',
        status: 'requires_payment_method',
        clientSecret: 'pi_123_secret_456',
      });
    });

    it('merges caller metadata with the bookingId and honours an explicit currency', async () => {
      stripeMock.paymentIntents.create.mockResolvedValue({
        id: 'pi_456',
        amount: 2500,
        currency: 'eur',
        status: 'requires_confirmation',
        client_secret: 'pi_456_secret',
      });

      await service.createPaymentIntent({
        amount: 2500,
        currency: 'eur',
        bookingId: 'booking-1',
        metadata: { elderId: 'elder-1' },
      });

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 2500,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        metadata: { bookingId: 'booking-1', elderId: 'elder-1' },
      });
      expect(mockLoggerService.logEvent).toHaveBeenCalledWith(
        'Payment intent created',
        'PaymentIntent',
        'pi_456',
        expect.objectContaining({ amount: 2500, currency: 'eur', bookingId: 'booking-1' }),
      );
    });

    it('translates a Stripe failure into a BadRequestException and logs it', async () => {
      stripeMock.paymentIntents.create.mockRejectedValue(new Error('card_declined'));

      await expect(service.createPaymentIntent({ amount: 5000 })).rejects.toThrow(
        BadRequestException,
      );
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to create payment intent',
        '',
        'PaymentService',
        expect.objectContaining({ error: 'card_declined', amount: 5000 }),
      );
    });
  });

  describe('getPaymentIntent', () => {
    it('returns the payment method and metadata but never the client secret', async () => {
      stripeMock.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        client_secret: 'pi_123_secret_456',
        payment_method: 'pm_123',
        metadata: { bookingId: 'booking-1' },
      });

      const result = await service.getPaymentIntent('pi_123');

      expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
      expect(result).toEqual({
        id: 'pi_123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        paymentMethod: 'pm_123',
        metadata: { bookingId: 'booking-1' },
      });
      expect(result).not.toHaveProperty('clientSecret');
    });

    it('throws "Payment intent not found" when Stripe rejects', async () => {
      stripeMock.paymentIntents.retrieve.mockRejectedValue(new Error('No such payment_intent'));

      await expect(service.getPaymentIntent('pi_missing')).rejects.toThrow(
        'Payment intent not found',
      );
    });
  });

  describe('confirmPaymentIntent', () => {
    it('confirms with the given payment method and returns the confirmed status', async () => {
      stripeMock.paymentIntents.confirm.mockResolvedValue({
        id: 'pi_123',
        status: 'succeeded',
        amount: 5000,
        currency: 'usd',
      });

      const result = await service.confirmPaymentIntent('pi_123', 'pm_123');

      expect(stripeMock.paymentIntents.confirm).toHaveBeenCalledWith('pi_123', {
        payment_method: 'pm_123',
      });
      expect(result).toEqual({
        id: 'pi_123',
        status: 'succeeded',
        amount: 5000,
        currency: 'usd',
      });
    });
  });

  describe('cancelPaymentIntent', () => {
    it('returns only the id and status of the canceled intent', async () => {
      stripeMock.paymentIntents.cancel.mockResolvedValue({
        id: 'pi_123',
        status: 'canceled',
        amount: 5000,
        currency: 'usd',
      });

      const result = await service.cancelPaymentIntent('pi_123');

      expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith('pi_123');
      expect(result).toEqual({ id: 'pi_123', status: 'canceled' });
    });
  });

  describe('getCustomer', () => {
    it('rejects a deleted customer', async () => {
      stripeMock.customers.retrieve.mockResolvedValue({
        id: 'cus_123',
        deleted: true,
      });

      await expect(service.getCustomer('cus_123')).rejects.toThrow(BadRequestException);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to retrieve customer',
        '',
        'PaymentService',
        expect.objectContaining({ customerId: 'cus_123' }),
      );
    });

    it('returns the customer profile fields for a live customer', async () => {
      stripeMock.customers.retrieve.mockResolvedValue({
        id: 'cus_123',
        email: 'elder@example.com',
        name: 'Jane Doe',
        phone: '+15550000000',
        metadata: { userId: 'user-1' },
        deleted: undefined,
      });

      const result = await service.getCustomer('cus_123');

      expect(result).toEqual({
        id: 'cus_123',
        email: 'elder@example.com',
        name: 'Jane Doe',
        phone: '+15550000000',
        metadata: { userId: 'user-1' },
      });
    });
  });

  describe('listPaymentMethods', () => {
    it('maps Stripe snake_case card fields to camelCase and tolerates non-card methods', async () => {
      stripeMock.paymentMethods.list.mockResolvedValue({
        data: [
          {
            id: 'pm_card',
            type: 'card',
            card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2030 },
          },
          { id: 'pm_other', type: 'us_bank_account', card: null },
        ],
      });

      const result = await service.listPaymentMethods('cus_123');

      expect(stripeMock.paymentMethods.list).toHaveBeenCalledWith({
        customer: 'cus_123',
        type: 'card',
      });
      expect(result).toEqual([
        {
          id: 'pm_card',
          type: 'card',
          card: { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2030 },
        },
        { id: 'pm_other', type: 'us_bank_account', card: undefined },
      ]);
    });
  });

  describe('createRefund', () => {
    it('forwards the partial amount and reason to Stripe and returns the refund summary', async () => {
      stripeMock.refunds.create.mockResolvedValue({
        id: 're_123',
        amount: 2500,
        status: 'succeeded',
        reason: 'requested_by_customer',
      });

      const result = await service.createRefund({
        paymentIntentId: 'pi_123',
        amount: 2500,
        reason: 'requested_by_customer',
      });

      expect(stripeMock.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 2500,
        reason: 'requested_by_customer',
      });
      expect(result).toEqual({
        id: 're_123',
        amount: 2500,
        status: 'succeeded',
        reason: 'requested_by_customer',
      });
    });

    it('sends undefined amount/reason for a full refund', async () => {
      stripeMock.refunds.create.mockResolvedValue({
        id: 're_456',
        amount: 5000,
        status: 'pending',
        reason: null,
      });

      await service.createRefund({ paymentIntentId: 'pi_123' });

      expect(stripeMock.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: undefined,
        reason: undefined,
      });
    });
  });

  describe('getPaymentHistory', () => {
    it('defaults to a limit of 10 and converts the Stripe unix timestamp to a Date', async () => {
      stripeMock.paymentIntents.list.mockResolvedValue({
        data: [
          {
            id: 'pi_123',
            amount: 5000,
            currency: 'usd',
            status: 'succeeded',
            created: 1700000000,
            metadata: { bookingId: 'booking-1' },
          },
        ],
      });

      const result = await service.getPaymentHistory('cus_123');

      expect(stripeMock.paymentIntents.list).toHaveBeenCalledWith({
        customer: 'cus_123',
        limit: 10,
      });
      expect(result).toEqual([
        {
          id: 'pi_123',
          amount: 5000,
          currency: 'usd',
          status: 'succeeded',
          created: new Date(1700000000 * 1000),
          metadata: { bookingId: 'booking-1' },
        },
      ]);
    });
  });

  describe('handleWebhook', () => {
    const payload = Buffer.from('{}');
    const signature = 'sig_test';

    it('rejects before touching Stripe when the webhook secret is not configured', async () => {
      config.STRIPE_WEBHOOK_SECRET = undefined;

      await expect(service.handleWebhook(payload, signature)).rejects.toThrow(
        'Webhook secret not configured',
      );
      expect(stripeMock.webhooks.constructEvent).not.toHaveBeenCalled();
    });

    it('confirms the booking on payment_intent.succeeded', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_1',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            amount: 5000,
            currency: 'usd',
            metadata: { bookingId: 'booking-1' },
          },
        },
      });
      mockPrismaService.booking.update.mockResolvedValue({ id: 'booking-1' });

      const result = await service.handleWebhook(payload, signature);

      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test_123',
      );
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          status: 'CONFIRMED',
          notes: 'Payment confirmed: pi_123',
        },
      });
      expect(result).toEqual({ received: true });
    });

    it('skips the booking update when the succeeded intent carries no bookingId', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_2',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_999', amount: 100, currency: 'usd', metadata: {} } },
      });

      await expect(service.handleWebhook(payload, signature)).resolves.toEqual({
        received: true,
      });
      expect(mockPrismaService.booking.update).not.toHaveBeenCalled();
    });

    it('swallows a booking update failure and still acknowledges the webhook', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_3',
        type: 'payment_intent.succeeded',
        data: {
          object: { id: 'pi_123', amount: 5000, currency: 'usd', metadata: { bookingId: 'gone' } },
        },
      });
      mockPrismaService.booking.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.handleWebhook(payload, signature)).resolves.toEqual({
        received: true,
      });
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Failed to update booking status',
        '',
        'PaymentService',
        expect.objectContaining({ error: 'Record not found', bookingId: 'gone' }),
      );
    });

    it('records a failed payment as a medium-severity security event', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_4',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_fail',
            amount: 3000,
            last_payment_error: { message: 'Your card was declined.' },
          },
        },
      });

      await service.handleWebhook(payload, signature);

      expect(mockLoggerService.logSecurity).toHaveBeenCalledWith('Payment failed', 'medium', {
        paymentIntentId: 'pi_fail',
        amount: 3000,
        lastPaymentError: 'Your card was declined.',
      });
      expect(mockPrismaService.booking.update).not.toHaveBeenCalled();
    });

    it('annotates the booking without changing its status on payment_intent.canceled', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_5',
        type: 'payment_intent.canceled',
        data: {
          object: { id: 'pi_cancel', amount: 5000, metadata: { bookingId: 'booking-2' } },
        },
      });
      mockPrismaService.booking.update.mockResolvedValue({ id: 'booking-2' });

      await service.handleWebhook(payload, signature);

      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-2' },
        data: { notes: 'Payment canceled: pi_cancel' },
      });
    });

    it('rejects an event whose signature cannot be verified', async () => {
      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature');
      });

      await expect(service.handleWebhook(payload, 'bad_sig')).rejects.toThrow(
        'Webhook verification failed',
      );
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        'Webhook verification failed',
        '',
        'PaymentService',
        expect.objectContaining({
          error: 'No signatures found matching the expected signature',
        }),
      );
    });
  });

  describe('getPublicKey', () => {
    it('returns the configured publishable key', () => {
      expect(service.getPublicKey()).toBe('pk_test_123');
    });

    it('falls back to an empty string when unset', () => {
      mockConfigService.get.mockReturnValueOnce(undefined);

      expect(service.getPublicKey()).toBe('');
    });
  });
});
