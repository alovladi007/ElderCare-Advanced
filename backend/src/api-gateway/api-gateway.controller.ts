import {
  Controller,
  All,
  Req,
  Res,
  Get,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiGatewayService } from './api-gateway.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * API Gateway Controller
 * Proxies requests to legacy backend services
 */
@Controller('gateway')
export class ApiGatewayController {
  constructor(private readonly gatewayService: ApiGatewayService) {}

  /**
   * Health check for all backend services
   */
  @Get('health')
  async checkHealth() {
    const services = await this.gatewayService.checkServices();
    return {
      gateway: true,
      services,
    };
  }

  /**
   * Proxy to legacy server (port 5000)
   * Routes: /gateway/legacy/*
   */
  @All('legacy/*')
  @UseGuards(JwtAuthGuard)
  async proxyToLegacy(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: Record<string, string>,
  ) {
    const path = req.path.replace('/gateway/legacy', '');
    const method = req.method;
    const body = req.body;

    try {
      const result = await this.gatewayService.proxyToLegacy(
        path,
        method,
        body,
        headers,
      );
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json(error.response || { message: error.message });
    }
  }

  /**
   * Proxy to monitoring backend (port 5001)
   * Routes: /gateway/monitoring/*
   */
  @All('monitoring/*')
  @UseGuards(JwtAuthGuard)
  async proxyToMonitoring(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: Record<string, string>,
  ) {
    const path = req.path.replace('/gateway/monitoring', '');
    const method = req.method;
    const body = req.body;

    try {
      const result = await this.gatewayService.proxyToMonitoring(
        path,
        method,
        body,
        headers,
      );
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json(error.response || { message: error.message });
    }
  }

  /**
   * Get service endpoints map
   */
  @Get('routes')
  getRoutes() {
    return {
      '/gateway/health': 'Health check for all services',
      '/gateway/legacy/*': 'Proxy to legacy server (port 5000)',
      '/gateway/monitoring/*': 'Proxy to monitoring backend (port 5001)',
      examples: {
        legacy_bookings: 'GET /gateway/legacy/api/bookings',
        monitoring_auth: 'POST /gateway/monitoring/api/auth/login',
        monitoring_patients: 'GET /gateway/monitoring/api/patients',
      },
      note: 'All routes except /gateway/health require JWT authentication',
    };
  }
}
