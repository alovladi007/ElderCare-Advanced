import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { Request } from 'express';
import { OptionalIntPipe } from '../common/pipes/optional-int.pipe';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get Stripe public key for client' })
  getConfig() {
    return {
      publishableKey: this.paymentService.getPublicKey(),
    };
  }

  @Post('payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent' })
  async createPaymentIntent(
    @Body()
    body: {
      amount: number; // in cents (e.g., 5000 = $50.00)
      currency?: string;
      bookingId?: string;
      metadata?: Record<string, string>;
    },
  ) {
    return this.paymentService.createPaymentIntent(body);
  }

  @Get('payment-intent/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment intent by ID' })
  async getPaymentIntent(@Param('id') id: string) {
    return this.paymentService.getPaymentIntent(id);
  }

  @Post('payment-intent/:id/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment intent' })
  async confirmPaymentIntent(
    @Param('id') id: string,
    @Body() body: { paymentMethodId: string },
  ) {
    return this.paymentService.confirmPaymentIntent(id, body.paymentMethodId);
  }

  @Post('payment-intent/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel payment intent' })
  async cancelPaymentIntent(@Param('id') id: string) {
    return this.paymentService.cancelPaymentIntent(id);
  }

  @Post('customers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe customer' })
  async createCustomer(
    @Body()
    body: {
      email: string;
      name: string;
      phone?: string;
      metadata?: Record<string, string>;
    },
  ) {
    return this.paymentService.createCustomer(body);
  }

  @Get('customers/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer by ID' })
  async getCustomer(@Param('id') id: string) {
    return this.paymentService.getCustomer(id);
  }

  @Post('payment-methods/attach')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Attach payment method to customer' })
  async attachPaymentMethod(
    @Body() body: { paymentMethodId: string; customerId: string },
  ) {
    return this.paymentService.attachPaymentMethod(
      body.paymentMethodId,
      body.customerId,
    );
  }

  @Get('payment-methods/customer/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List customer payment methods' })
  async listPaymentMethods(@Param('customerId') customerId: string) {
    return this.paymentService.listPaymentMethods(customerId);
  }

  @Delete('payment-methods/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detach payment method' })
  async detachPaymentMethod(@Param('id') id: string) {
    return this.paymentService.detachPaymentMethod(id);
  }

  @Post('refunds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create refund' })
  async createRefund(
    @Body()
    body: {
      paymentIntentId: string;
      amount?: number;
      reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    },
  ) {
    return this.paymentService.createRefund(body);
  }

  @Get('history/:customerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history for customer' })
  async getPaymentHistory(
    @Param('customerId') customerId: string,
    @Query('limit', OptionalIntPipe) limit?: number,
  ) {
    return this.paymentService.getPaymentHistory(customerId, limit);
  }

  @Post('webhook')
  @ApiExcludeEndpoint() // Exclude from Swagger docs
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // The raw body is needed for webhook signature verification
    return this.paymentService.handleWebhook(req.rawBody!, signature);
  }
}
