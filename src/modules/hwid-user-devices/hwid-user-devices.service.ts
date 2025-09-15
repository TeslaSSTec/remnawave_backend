import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryBus } from '@nestjs/cqrs';

import { ICommandResponse } from '@common/types/command-response.type';
import { GetAllHwidDevicesCommand } from '@libs/contracts/commands';
import { ERRORS, EVENTS } from '@libs/contracts/constants';

import { UserHwidDeviceEvent } from '@integration-modules/notifications/interfaces';

import { GetUserByUniqueFieldQuery } from '@modules/users/queries/get-user-by-unique-field';

import { HwidUserDevicesRepository } from './repositories/hwid-user-devices.repository';
import { HwidUserDeviceEntity } from './entities/hwid-user-device.entity';
import { GetHwidDevicesStatsResponseModel } from './models';
import { CreateUserHwidDeviceRequestDto } from './dtos';

@Injectable()
export class HwidUserDevicesService {
    private readonly logger = new Logger(HwidUserDevicesService.name);
    private readonly hwidDeviceLimitEnabled: boolean;
    private readonly hwidGlobalDeviceLimit: number | undefined;

    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly hwidUserDevicesRepository: HwidUserDevicesRepository,
        private readonly configService: ConfigService,
        private readonly queryBus: QueryBus,
    ) {
        this.hwidDeviceLimitEnabled =
            this.configService.getOrThrow<string>('HWID_DEVICE_LIMIT_ENABLED') === 'true';
        this.hwidGlobalDeviceLimit = this.configService.get<number | undefined>(
            'HWID_FALLBACK_DEVICE_LIMIT',
        );
    }

    public async createUserHwidDevice(
        dto: CreateUserHwidDeviceRequestDto,
    ): Promise<ICommandResponse<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: dto.userUuid,
                    },
                    {
                        activeInternalSquads: false,
                        lastConnectedNode: false,
                    },
                ),
            );

            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const isDeviceExists = await this.hwidUserDevicesRepository.checkHwidExists(
                dto.hwid,
                dto.userUuid,
            );

            if (isDeviceExists) {
                return {
                    isOk: false,
                    ...ERRORS.USER_HWID_DEVICE_ALREADY_EXISTS,
                };
            }

            if (this.hwidDeviceLimitEnabled && this.hwidGlobalDeviceLimit) {
                const count = await this.hwidUserDevicesRepository.countByUserUuid(dto.userUuid);

                const deviceLimit = user.response.hwidDeviceLimit ?? this.hwidGlobalDeviceLimit;

                if (count >= deviceLimit) {
                    return {
                        isOk: false,
                        ...ERRORS.USER_HWID_DEVICE_LIMIT_REACHED,
                    };
                }
            }

            const result = await this.hwidUserDevicesRepository.create(
                new HwidUserDeviceEntity(dto),
            );

            this.eventEmitter.emit(
                EVENTS.USER_HWID_DEVICES.ADDED,
                new UserHwidDeviceEvent(user.response, result, EVENTS.USER_HWID_DEVICES.ADDED),
            );

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userUuid: dto.userUuid,
            });

            return {
                isOk: true,
                response: userHwidDevices,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.CREATE_HWID_USER_DEVICE_ERROR,
            };
        }
    }

    public async getUserHwidDevices(
        userUuid: string,
    ): Promise<ICommandResponse<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuid,
                    },
                    {
                        activeInternalSquads: false,
                        lastConnectedNode: false,
                    },
                ),
            );

            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userUuid,
            });

            return {
                isOk: true,
                response: userHwidDevices,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_USER_HWID_DEVICES_ERROR,
            };
        }
    }

    public async deleteUserHwidDevice(
        hwid: string,
        userUuid: string,
    ): Promise<ICommandResponse<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuid,
                    },
                    {
                        activeInternalSquads: false,
                        lastConnectedNode: false,
                    },
                ),
            );

            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            const hwidDevice = await this.hwidUserDevicesRepository.findFirstByCriteria({
                hwid,
                userUuid,
            });

            await this.hwidUserDevicesRepository.deleteByHwidAndUserUuid(hwid, userUuid);

            if (hwidDevice) {
                this.eventEmitter.emit(
                    EVENTS.USER_HWID_DEVICES.DELETED,
                    new UserHwidDeviceEvent(
                        user.response,
                        hwidDevice,
                        EVENTS.USER_HWID_DEVICES.DELETED,
                    ),
                );
            }

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userUuid,
            });

            return {
                isOk: true,
                response: userHwidDevices,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_HWID_USER_DEVICE_ERROR,
            };
        }
    }

    public async deleteAllUserHwidDevices(
        userUuid: string,
    ): Promise<ICommandResponse<HwidUserDeviceEntity[]>> {
        try {
            const user = await this.queryBus.execute(
                new GetUserByUniqueFieldQuery(
                    {
                        uuid: userUuid,
                    },
                    {
                        activeInternalSquads: false,
                        lastConnectedNode: false,
                    },
                ),
            );

            if (!user.isOk || !user.response) {
                return {
                    isOk: false,
                    ...ERRORS.USER_NOT_FOUND,
                };
            }

            await this.hwidUserDevicesRepository.deleteByUserUuid(userUuid);

            const userHwidDevices = await this.hwidUserDevicesRepository.findByCriteria({
                userUuid,
            });

            return {
                isOk: true,
                response: userHwidDevices,
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.DELETE_HWID_USER_DEVICES_ERROR,
            };
        }
    }

    public async getAllHwidDevices(dto: GetAllHwidDevicesCommand.RequestQuery): Promise<
        ICommandResponse<{
            total: number;
            devices: HwidUserDeviceEntity[];
        }>
    > {
        try {
            const [devices, total] = await this.hwidUserDevicesRepository.getAllHwidDevices(dto);

            return {
                isOk: true,
                response: {
                    devices,
                    total,
                },
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_ALL_HWID_DEVICES_ERROR,
            };
        }
    }

    public async getHwidDevicesStats(): Promise<
        ICommandResponse<GetHwidDevicesStatsResponseModel>
    > {
        try {
            const stats = await this.hwidUserDevicesRepository.getHwidDevicesStats();

            return {
                isOk: true,
                response: new GetHwidDevicesStatsResponseModel({
                    byPlatform: stats.byPlatform,
                    byApp: stats.byApp,
                    stats: stats.stats,
                }),
            };
        } catch (error) {
            this.logger.error(error);
            return {
                isOk: false,
                ...ERRORS.GET_HWID_DEVICES_STATS_ERROR,
            };
        }
    }
}
