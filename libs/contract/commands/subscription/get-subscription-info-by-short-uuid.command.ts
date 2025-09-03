import { z } from 'zod';

import { REST_API, SUBSCRIPTION_ROUTES } from '../../api';
import { SubscriptionInfoSchema } from '../../models';
import { getEndpointDetails } from '../../constants';

export namespace GetSubscriptionInfoByShortUuidCommand {
    export const url = REST_API.SUBSCRIPTION.GET_INFO;
    export const TSQ_url = url(':shortUuid');

    export const endpointDetails = getEndpointDetails(
        SUBSCRIPTION_ROUTES.GET_INFO(':shortUuid'),
        'get',
        'Get Subscription Info by Short UUID',
    );

    export const RequestSchema = z.object({
        shortUuid: z.string(),
    });

    export type Request = z.infer<typeof RequestSchema>;

    export const ResponseSchema = z.object({
        response: SubscriptionInfoSchema,
    });

    export type Response = z.infer<typeof ResponseSchema>;
}
