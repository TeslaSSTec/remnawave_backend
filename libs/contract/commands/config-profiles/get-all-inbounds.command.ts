import { z } from 'zod';

import { CONFIG_PROFILES_ROUTES, REST_API } from '../../api';
import { ConfigProfileInboundsSchema } from '../../models';
import { getEndpointDetails } from '../../constants';

export namespace GetAllInboundsCommand {
    export const url = REST_API.CONFIG_PROFILES.GET_ALL_INBOUNDS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        CONFIG_PROFILES_ROUTES.GET_ALL_INBOUNDS,
        'get',
        'Get all inbounds from all config profiles',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            total: z.number(),
            inbounds: z.array(
                ConfigProfileInboundsSchema.extend({
                    activeSquads: z.array(z.string().uuid()),
                }),
            ),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
