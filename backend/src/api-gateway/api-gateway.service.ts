import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

/**
 * API Gateway Service
 * Routes requests to appropriate backend services
 */
@Injectable()
export class ApiGatewayService {
  private readonly serviceUrls = {
    legacy: process.env.LEGACY_SERVER_URL || 'http://localhost:5000',
    monitoring: process.env.MONITORING_SERVER_URL || 'http://localhost:5001',
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * Proxy request to legacy server (Express - port 5000)
   */
  async proxyToLegacy(
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(this.serviceUrls.legacy, path, method, body, headers);
  }

  /**
   * Proxy request to monitoring backend (Express + Socket.io - port 5001)
   */
  async proxyToMonitoring(
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    return this.proxyRequest(this.serviceUrls.monitoring, path, method, body, headers);
  }

  /**
   * Generic proxy method
   */
  private async proxyRequest(
    baseUrl: string,
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    try {
      const config: AxiosRequestConfig = {
        method,
        url: `${baseUrl}${path}`,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        data: body,
      };

      const response = await firstValueFrom(this.httpService.request(config));
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.data || 'Proxied request failed',
          error.response.status,
        );
      } else {
        throw new HttpException(
          `Failed to connect to service at ${baseUrl}`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }
  }

  /**
   * Health check for backend services
   */
  async checkServices(): Promise<{
    legacy: boolean;
    monitoring: boolean;
  }> {
    const checks = {
      legacy: false,
      monitoring: false,
    };

    try {
      await firstValueFrom(
        this.httpService.get(`${this.serviceUrls.legacy}/api/health`),
      );
      checks.legacy = true;
    } catch {
      // Service unavailable
    }

    try {
      await firstValueFrom(
        this.httpService.get(`${this.serviceUrls.monitoring}/api/health`),
      );
      checks.monitoring = true;
    } catch {
      // Service unavailable
    }

    return checks;
  }
}
