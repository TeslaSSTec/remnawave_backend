import { z } from 'zod';

import { getEndpointDetails } from '../../constants';
import { HWID_ROUTES, REST_API } from '../../api';

export namespace GetHwidDevicesStatsCommand {
    export const url = REST_API.HWID.STATS;
    export const TSQ_url = url;

    export const endpointDetails = getEndpointDetails(
        HWID_ROUTES.STATS,
        'get',
        'Get HWID devices stats',
    );

    export const ResponseSchema = z.object({
        response: z.object({
            byPlatform: z.array(
                z.object({
                    platform: z.string(),
                    count: z.number(),
                }),
            ),
            byApp: z.array(
                z.object({
                    app: z.string(),
                    count: z.number(),
                }),
            ),
            stats: z.object({
                totalUniqueDevices: z.number(),
                totalHwidDevices: z.number(),
                averageHwidDevicesPerUser: z.number(),
            }),
        }),
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
