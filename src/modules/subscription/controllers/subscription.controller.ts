import { Request, Response } from 'express';

import {
    Controller,
    Get,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseFilters,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { OptionalJwtGuard } from '@common/guards/jwt-guards/optional-jwt-guard';
import { HttpExceptionFilter } from '@common/exception/httpException.filter';
import { JwtDefaultGuard } from '@common/guards/jwt-guards/def-jwt-guard';
import { extractHwidHeaders } from '@common/utils/extract-hwid-headers';
import { GetOptionalAuth } from '@common/decorators/get-optional-auth';
import { errorHandler } from '@common/helpers/error-handler.helper';
import { RolesGuard } from '@common/guards/roles/roles.guard';
import { Endpoint } from '@common/decorators/base-endpoint';
import { Roles } from '@common/decorators/roles';
import {
    GetRawSubscriptionByShortUuidCommand,
    GetSubscriptionInfoByShortUuidCommand,
} from '@libs/contracts/commands';
import { SUBSCRIPTION_CONTROLLER, SUBSCRIPTION_ROUTES } from '@libs/contracts/api';
import { REQUEST_TEMPLATE_TYPE, ROLE } from '@libs/contracts/constants';

import {
    GetOutlineSubscriptionRequestDto,
    GetRawSubscriptionByShortUuidRequestDto,
    GetRawSubscriptionByShortUuidRequestQueryDto,
    GetRawSubscriptionByShortUuidResponseDto,
    GetSubscriptionByShortUuidByClientTypeRequestDto,
    GetSubscriptionInfoRequestDto,
    GetSubscriptionInfoResponseDto,
} from '../dto';
import {
    RawSubscriptionWithHostsResponse,
    SubscriptionNotFoundResponse,
    SubscriptionRawResponse,
} from '../models';
import { GetSubscriptionByShortUuidRequestDto } from '../dto/get-subscription.dto';
import { SubscriptionService } from '../subscription.service';

@ApiTags('Subscription Controller')
@UseFilters(HttpExceptionFilter)
@Controller(SUBSCRIPTION_CONTROLLER)
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: 'Subscription info fetched successfully',
        type: GetSubscriptionInfoResponseDto,
    })
    @Endpoint({
        command: GetSubscriptionInfoByShortUuidCommand,
        httpCode: HttpStatus.OK,
    })
    @UseGuards(OptionalJwtGuard)
    async getSubscriptionInfoByShortUuid(
        @Param() { shortUuid }: GetSubscriptionInfoRequestDto,
        @GetOptionalAuth() authenticatedFromBrowser: boolean,
    ): Promise<GetSubscriptionInfoResponseDto> {
        const result = await this.subscriptionService.getSubscriptionInfoByShortUuid(
            shortUuid,
            undefined,
            authenticatedFromBrowser,
        );

        const data = errorHandler(result);
        return {
            response: data,
        };
    }

    @ApiBearerAuth('Authorization')
    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @ApiQuery({
        name: 'withDisabledHosts',
        type: Boolean,
        description: 'Include disabled hosts in the subscription. Default is false.',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: 'Raw subscription fetched successfully',
        type: GetRawSubscriptionByShortUuidResponseDto,
    })
    @Endpoint({
        command: GetRawSubscriptionByShortUuidCommand,
        httpCode: HttpStatus.OK,
    })
    @Roles(ROLE.ADMIN, ROLE.API)
    @UseGuards(JwtDefaultGuard, RolesGuard)
    async getRawSubscriptionByShortUuid(
        @Param() { shortUuid }: GetRawSubscriptionByShortUuidRequestDto,
        @Query() { withDisabledHosts }: GetRawSubscriptionByShortUuidRequestQueryDto,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<GetRawSubscriptionByShortUuidResponseDto | Response> {
        const result = await this.subscriptionService.getRawSubscriptionByShortUuid(
            shortUuid,
            request.headers['user-agent'] as string,
            withDisabledHosts,
            extractHwidHeaders(request),
        );

        if (result instanceof RawSubscriptionWithHostsResponse) {
            return response.status(200).send({
                response: {
                    ...result,
                },
            });
        }

        return response.status(404).send(result);
    }

    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @Get([SUBSCRIPTION_ROUTES.GET + '/:shortUuid'])
    async getSubscription(
        @Param() { shortUuid }: GetSubscriptionByShortUuidRequestDto,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<Response> {
        const result = await this.subscriptionService.getSubscriptionByShortUuid(
            shortUuid,
            (request.headers['user-agent'] as string) || '',
            ((request.headers['accept'] as string) || '').includes('text/html'),
            undefined,
            extractHwidHeaders(request),
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            return response.status(200).send(result);
        }

        return response.set(result.headers).type(result.contentType).send(result.body);
    }

    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @ApiParam({
        name: 'clientType',
        type: String,
        description: 'Client type',
        required: true,
        enum: REQUEST_TEMPLATE_TYPE,
    })
    @Get([SUBSCRIPTION_ROUTES.GET + '/:shortUuid' + '/:clientType'])
    async getSubscriptionByClientType(
        @Param() { shortUuid, clientType }: GetSubscriptionByShortUuidByClientTypeRequestDto,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<Response> {
        const result = await this.subscriptionService.getSubscriptionByShortUuid(
            shortUuid,
            (request.headers['user-agent'] as string) || '',
            ((request.headers['accept'] as string) || '').includes('text/html'),
            clientType,
            extractHwidHeaders(request),
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            return response.status(200).send(result);
        }

        return response.set(result.headers).type(result.contentType).send(result.body);
    }

    @ApiParam({
        name: 'shortUuid',
        type: String,
        description: 'Short UUID of the user',
        required: true,
    })
    @ApiParam({
        name: 'type',
        type: String,
        description:
            'Subscription type (required if encodedTag is provided). Only SS is supported for now.',
        required: true,
        example: 'ss',
    })
    @ApiParam({
        name: 'encodedTag',
        type: String,
        description:
            'Base64 encoded tag for Outline config. This paramter is optional. It is required only when type=ss.',
        required: true,
        example: 'VGVzdGVy',
    })
    @Get([SUBSCRIPTION_ROUTES.GET_OUTLINE + '/:shortUuid/:type/:encodedTag'])
    async getSubscriptionWithType(
        @Param() { shortUuid }: GetOutlineSubscriptionRequestDto,
        @Req() request: Request,
        @Res() response: Response,
        @Param('type') type?: string,
        @Param('encodedTag') encodedTag?: string,
    ): Promise<Response> {
        let isOutlineConfig = false;
        if (type === 'ss' && encodedTag) {
            isOutlineConfig = true;
        }

        const result = await this.subscriptionService.getOutlineSubscriptionByShortUuid(
            shortUuid,
            (request.headers['user-agent'] as string) || '',
            ((request.headers['accept'] as string) || '').includes('text/html'),
            isOutlineConfig,
            encodedTag,
        );

        if (result instanceof SubscriptionNotFoundResponse) {
            return response.status(404).send(result);
        }

        if (result instanceof SubscriptionRawResponse) {
            return response.status(200).send(result);
        }

        return response.set(result.headers).type(result.contentType).send(result.body);
    }
}
