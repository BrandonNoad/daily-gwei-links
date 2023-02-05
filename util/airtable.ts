import type { AirtableBase } from 'airtable/lib/airtable_base';
import type { QueryParams } from 'airtable/lib/query_params';
import type { YouTubeVideo } from '../pages/api/updateVideos';

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
    text: null | {
        value: string;
        before: string;
        after: string;
    };
    url: string;
    children: LinkDataItem[];
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

const generateYouTubeUrl = ({ videoId, timestamp }: { videoId: string; timestamp: string }) => {
    let timestampParts = timestamp.split(':').map((str) => str.padStart(2, '0'));

    if (timestampParts.length === 2) {
        timestampParts = ['00', ...timestampParts];
    }

    if (timestampParts.length !== 3) {
        throw new Error('Bad implementation!');
    }

    const [hours, minutes, seconds] = timestampParts.map((part) => +part);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    return `https://www.youtube.com/watch?v=${videoId}&t=${totalSeconds}s`;
};

const timestampRegex = /^\d?\d:(?:\d?\d:)?\d\d/;

const findTimestamp = (line: string) => line.match(timestampRegex)?.[0] ?? null;

const isUrl = (line: string) => line.startsWith('https');

const generateLinkData = ({
    id,
    description
}: {
    id: string;
    description: string;
}): LinkDataItem[] => {
    let parent: LinkDataItem | null = null;

    return description.split('\n').reduce((acc: LinkDataItem[], line: string) => {
        const timestamp = findTimestamp(line);

        if (timestamp !== null) {
            parent = {
                text: {
                    value: timestamp,
                    before: `${line.slice(timestamp.length).trim()} (`,
                    after: ')'
                },
                url: generateYouTubeUrl({ videoId: id, timestamp }),
                children: []
            };

            return [...acc, parent];
        }

        if (isUrl(line)) {
            const [url] = line.split(' ');

            const linkDataItem: LinkDataItem = { text: null, url: url.trim(), children: [] };

            if (parent !== null) {
                parent.children.push(linkDataItem);
                return acc;
            }

            return [...acc, linkDataItem];
        }

        parent = null;
        return acc;
    }, []);
};

export const addVideos = async (payload: YouTubeVideo[]) => {
    const base = getAirtableBase();

    await base<VideosRecordFields>('videos').create(
        payload.map((item) => ({
            fields: { ...item, linkData: JSON.stringify(generateLinkData(item)) }
        }))
    );
};
