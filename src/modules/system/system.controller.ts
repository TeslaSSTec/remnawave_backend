import { Controller, HttpStatus, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles/roles';
import { RolesGuard } from '@common/guards/roles';
import {
    GenerateX25519Command,
    GetBandwidthStatsCommand,
    GetNodesMetricsCommand,
    GetNodesStatisticsCommand,
    GetRemnawaveHealthCommand,
    GetStatsCommand,
} from '@libs/contracts/commands';
import { SYSTEM_CONTROLLER } from '@libs/contracts/api';
import { ROLE } from '@libs/contracts/constants';

import {
    GetBandwidthStatsRequestQueryDto,
    GetBandwidthStatsResponseDto,
    GetNodesMetricsResponseDto,
    GetNodesStatisticsResponseDto,
    GetRemnawaveHealthResponseDto,
    GetStatsResponseDto,
    GenerateX25519ResponseDto,
} from './dtos';
import { SystemService } from './system.service';

@ApiBearerAuth('Authorization')
@ApiTags('System Controller')
@Roles(ROLE.ADMIN, ROLE.API)
@UseGuards(JwtDefaultGuard, RolesGuard)
@UseFilters(HttpExceptionFilter)
@Controller(SYSTEM_CONTROLLER)
export class SystemController {
    constructor(private readonly systemService: SystemService) {}

    @ApiResponse({
        status: 200,
        description: 'Returns system statistics',
        type: GetStatsResponseDto,
    })
    @Endpoint({
        command: GetStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getStats(): Promise<GetStatsResponseDto> {
        const result = await this.systemService.getStats();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns bandwidth statistics',
        type: GetBandwidthStatsResponseDto,
    })
    @Endpoint({
        command: GetBandwidthStatsCommand,
        httpCode: HttpStatus.OK,
    })
    async getBandwidthStats(
        @Query() query: GetBandwidthStatsRequestQueryDto,
    ): Promise<GetBandwidthStatsResponseDto> {
        const result = await this.systemService.getBandwidthStats(query);

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns nodes statistics',
        type: GetNodesStatisticsResponseDto,
    })
    @Endpoint({
        command: GetNodesStatisticsCommand,
        httpCode: HttpStatus.OK,
    })
    async getNodesStatistics(): Promise<GetNodesStatisticsResponseDto> {
        const result = await this.systemService.getNodesStatistics();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns Remnawave health',
        type: GetRemnawaveHealthResponseDto,
    })
    @Endpoint({
        command: GetRemnawaveHealthCommand,
        httpCode: HttpStatus.OK,
    })
    async getRemnawaveHealth(): Promise<GetRemnawaveHealthResponseDto> {
        const result = await this.systemService.getRemnawaveHealth();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns nodes metrics from Prometheus metrics endpoint',
        type: GetNodesMetricsResponseDto,
    })
    @Endpoint({
        command: GetNodesMetricsCommand,
        httpCode: HttpStatus.OK,
    })
    async getNodesMetrics(): Promise<GetNodesMetricsResponseDto> {
        const result = await this.systemService.getNodesMetrics();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiResponse({
        status: 200,
        description: 'Returns x25519 keypairs',
        type: GenerateX25519ResponseDto,
    })
    @Endpoint({
        command: GenerateX25519Command,
        httpCode: HttpStatus.OK,
    })
    async getX25519Keypairs(): Promise<GenerateX25519ResponseDto> {
        const result = await this.systemService.getX25519Keypairs();

        const data = errorHandler(result);
        return {
            response: data,
        };
    }
}
