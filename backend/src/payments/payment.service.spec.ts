import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/logging/logger.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe');

describe('PaymentService', () => {
  let service: PaymentService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let loggerService: LoggerService;
  let notificationsService: NotificationsService;
  let stripeMock: jest.Mocked<Stripe>;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockLoggerService = {
    debug: jest.fn(),
    logEvent: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logSecurity: jest.fn(),
  };

  const mockNotificationsService = {
    notifyPaymentStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
    loggerService = module.get<LoggerService>(LoggerService);
    notificationsService = module.get<NotificationsService>(NotificationsService);

    // Setup Stripe mock
    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_test_123',
      };
      return config[key];
    });

    // Create mock Stripe instance
    stripeMock = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        cancel: jest.fn(),
      },
      refunds: {
        create: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
      customers: {
        create: jest.fn(),
      },
      subscriptions: {
        create: jest.fn(),
        cancel: jest.fn(),
      },
    } as any;

    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(() => stripeMock as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const paymentData = {
        amount: 5000,
        currency: 'usd',
        bookingId: 'booking-1',
      };

      const stripePaymentIntent = {
        id: 'pi_123',
        amount: 5000,
        currency: 'usd',
        status: 'requires_payment_method',
        client_secret: 'pi_123_secret_456',
      };

      stripeMock.paymentIntents.create.mockResolvedValue(stripePaymentIntent as any);

      const result = await service.createPaymentIntent(paymentData);

      expect(result).toEqual({
        id: 'pi_123',
        amount: 5000,
        currency: 'usd',
        status: 'requires_payment_method',
        clientSecret: 'pi_123_secret_456',
      });

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          bookingId: 'booking-1',
        },
      });
    });

    it('should throw error when Stripe is not configured', async () => {
      mockConfigService.get.mockReturnValueOnce(null);

      const newService = new PaymentService(
        configService,
        loggerService,
        prismaService,
        notificationsService,
      );

      await expect(
        newService.createPaymentIntent({ amount: 5000 }),
      ).rejects.toThrow('Stripe is not configured');
    });
  });

  describe('retrievePaymentIntent', () => {
    it('should retrieve payment intent', async () => {
      const stripePaymentIntent = {
        id: 'pi_123',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        client_secret: 'pi_123_secret_456',
      };

      stripeMock.paymentIntents.retrieve.mockResolvedValue(stripePaymentIntent as any);

      const result = await service.retrievePaymentIntent('pi_123');

      expect(result.id).toBe('pi_123');
      expect(result.status).toBe('succeeded');
      expect(stripeMock.paymentIntents.retrieve).toHaveBeenCalledWith('pi_123');
    });
  });

  describe('cancelPaymentIntent', () => {
    it('should cancel payment intent', async () => {
      const canceledIntent = {
        id: 'pi_123',
        status: 'canceled',
      };

      stripeMock.paymentIntents.cancel.mockResolvedValue(canceledIntent as any);

      const result = await service.cancelPaymentIntent('pi_123');

      expect(result.status).toBe('canceled');
      expect(stripeMock.paymentIntents.cancel).toHaveBeenCalledWith('pi_123');
    });
  });

  describe('createRefund', () => {
    it('should create refund for payment intent', async () => {
      const refundData = {
        id: 're_123',
        payment_intent: 'pi_123',
        amount: 5000,
        status: 'succeeded',
      };

      stripeMock.refunds.create.mockResolvedValue(refundData as any);

      const result = await service.createRefund('pi_123', 5000);

      expect(result.id).toBe('re_123');
      expect(result.status).toBe('succeeded');
      expect(stripeMock.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 5000,
      });
    });

    it('should create partial refund', async () => {
      const refundData = {
        id: 're_123',
        payment_intent: 'pi_123',
        amount: 2500,
        status: 'succeeded',
      };

      stripeMock.refunds.create.mockResolvedValue(refundData as any);

      const result = await service.createRefund('pi_123', 2500);

      expect(result.amount).toBe(2500);
    });
  });

  describe('handleWebhook', () => {
    it('should process payment_intent.succeeded event', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            amount: 5000,
            currency: 'usd',
            metadata: {
              bookingId: 'booking-1',
            },
          },
        },
      };

      const booking = {
        id: 'booking-1',
        userId: 'user-1',
        status: 'PENDING_PAYMENT',
      };

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({ ...booking, status: 'CONFIRMED' });
      mockPrismaService.payment.create.mockResolvedValue({
        id: 'payment-1',
        paymentIntentId: 'pi_123',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
      });

      const payload = Buffer.from(JSON.stringify(mockEvent));
      const signature = 'test-signature';

      await service.handleWebhook(payload, signature);

      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test_123',
      );
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: 'CONFIRMED' },
      });
      expect(notificationsService.notifyPaymentStatus).toHaveBeenCalled();
    });

    it('should process payment_intent.payment_failed event', async () => {
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_456',
            amount: 3000,
            currency: 'usd',
            metadata: {
              bookingId: 'booking-2',
            },
          },
        },
      };

      const booking = {
        id: 'booking-2',
        userId: 'user-2',
      };

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent as any);
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.payment.create.mockResolvedValue({
        id: 'payment-2',
        paymentIntentId: 'pi_456',
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'user2@example.com',
      });

      const payload = Buffer.from(JSON.stringify(mockEvent));
      const signature = 'test-signature-2';

      await service.handleWebhook(payload, signature);

      expect(notificationsService.notifyPaymentStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          userId: 'user-2',
        }),
      );
    });

    it('should handle webhook signature verification error', async () => {
      const error = new Error('Invalid signature');
      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw error;
      });

      const payload = Buffer.from('invalid');
      const signature = 'invalid-signature';

      await expect(service.handleWebhook(payload, signature)).rejects.toThrow('Invalid signature');

      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('getPaymentHistory', () => {
    it('should retrieve payment history for user', async () => {
      const payments = [
        {
          id: 'payment-1',
          paymentIntentId: 'pi_123',
          amount: 5000,
          status: 'SUCCEEDED',
        },
        {
          id: 'payment-2',
          paymentIntentId: 'pi_456',
          amount: 3000,
          status: 'SUCCEEDED',
        },
      ];

      mockPrismaService.payment.findMany.mockResolvedValue(payments);

      const result = await service.getPaymentHistory('user-1');

      expect(result).toEqual(payments);
      expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getPayment', () => {
    it('should retrieve payment by id', async () => {
      const payment = {
        id: 'payment-1',
        paymentIntentId: 'pi_123',
        amount: 5000,
        status: 'SUCCEEDED',
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(payment);

      const result = await service.getPayment('payment-1');

      expect(result).toEqual(payment);
      expect(mockPrismaService.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
      });
    });
  });
});
