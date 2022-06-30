import type { AirtableBase } from 'airtable/lib/airtable_base';
import type { QueryParams } from 'airtable/lib/query_params';

import Airtable from 'airtable';
import { z } from 'zod';

const videosRecordSchema = z.object({
    fields: z.object({
        id: z.string(),
        title: z.string(),
        publishedAt: z.string(),
        linkData: z.string()
    })
});

type VideosRecordFields = z.infer<typeof videosRecordSchema.shape.fields>;

export type LinkDataItem = {
    text: string;
    url: string;
    children?: LinkDataItem[];
};

export type Video = Omit<VideosRecordFields, 'linkData'> & { linkData: LinkDataItem[] };

let airtableBase: AirtableBase | null = null;

const getAirtableBase = () => {
    if (airtableBase === null) {
        airtableBase = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
            process.env.AIRTABLE_API_BASE_ID ?? ''
        );
    }

    return airtableBase;
};

const commonSelectParams: QueryParams<VideosRecordFields> = {
    fields: ['id', 'title', 'publishedAt', 'linkData'],
    sort: [{ field: 'publishedAt', direction: 'desc' }]
};

const recordToVideo = ({ fields }: { fields: VideosRecordFields }): Video => {
    return {
        ...fields,
        linkData: JSON.parse(fields.linkData)
    };
};

export const fetchRecentVideos = async () => {
    const base = getAirtableBase();

    const results = await base<VideosRecordFields>('videos')
        // .select()
        .select({
            ...commonSelectParams,
            pageSize: 10
        })
        .firstPage();

    const records = z.array(videosRecordSchema).parse(results);

    return records.map(recordToVideo);
};

export const fetchAllVideos = async () => {
    const base = getAirtableBase();

    const results = await base<VideosRecordFields>('videos')
        .select({
            ...commonSelectParams
        })
        .all();

    const records = z.array(videosRecordSchema).parse(results);

    return records.map(recordToVideo);
};

export const addVideos = async (payload: Video[]) => {
    const base = getAirtableBase();

    await base<VideosRecordFields>('videos').create(
        payload.map((item) => ({ fields: { ...item, linkData: JSON.stringify(item.linkData) } }))
    );
};
