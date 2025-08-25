import { Hosts } from '@prisma/client';

import { Injectable } from '@nestjs/common';

import { UniversalConverter } from '@common/converter/universalConverter';

import { HostsEntity } from './entities/hosts.entity';

const modelToEntity = (model: Hosts): HostsEntity => {
    return new HostsEntity(model);
};

const entityToModel = (entity: HostsEntity): Hosts => {
    return {
        uuid: entity.uuid,

        viewPosition: entity.viewPosition,
        remark: entity.remark,
        address: entity.address,
        port: entity.port,
        path: entity.path,
        sni: entity.sni,
        host: entity.host,
        alpn: entity.alpn,
        fingerprint: entity.fingerprint,
        securityLayer: entity.securityLayer,
        isDisabled: entity.isDisabled,
        xHttpExtraParams: entity.xHttpExtraParams,
        muxParams: entity.muxParams,
        sockoptParams: entity.sockoptParams,
        serverDescription: entity.serverDescription,

        tag: entity.tag,
        isHidden: entity.isHidden,

        overrideSniFromAddress: entity.overrideSniFromAddress,

        configProfileUuid: entity.configProfileUuid,
        configProfileInboundUuid: entity.configProfileInboundUuid,

        vlessRouteId: entity.vlessRouteId,
    };
};

@Injectable()
export class HostsConverter extends UniversalConverter<HostsEntity, Hosts> {
    constructor() {
        super(modelToEntity, entityToModel);
    }
}
