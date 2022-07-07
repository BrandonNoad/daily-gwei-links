// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Video, LinkDataItem } from '../../util/airtable';

import { google, youtube_v3 } from 'googleapis';

import { fetchRecentVideos, addVideos } from '../../util/airtable';
import { groupVideosByMonth } from '../../util';

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

let parent: LinkDataItem | null = null;
const generateLinkData = ({
    id,
    description
}: {
    id: string;
    description: string;
}): LinkDataItem[] => {
    return description.split('\n').reduce((acc: LinkDataItem[], line: string) => {
        const timestamp = findTimestamp(line);

        if (timestamp !== null) {
            parent = {
                text: `${line.slice(timestamp.length).trim()} (${timestamp})`,
                url: generateYouTubeUrl({ videoId: id, timestamp }),
                children: []
            };

            return [...acc, parent];
        }

        if (isUrl(line)) {
            const [url] = line.split(' ');

            const linkDataItem: LinkDataItem = { text: '', url: url.trim() };

            if (parent !== null) {
                if (parent.children === undefined) {
                    parent.children = [];
                }

                parent.children.push(linkDataItem);
                return acc;
            }

            return [...acc, linkDataItem];
        }

        parent = null;
        return acc;
    }, []);
};

type ValidNewItem = {
    id: string;
    snippet: { publishedAt: string; title?: string; description?: string };
};

const fetchNewVideos = async (latestVideos: Video[]) => {
    const youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY
    });

    let newVideos: Video[] = [];

    let pageToken: string | undefined;
    let isNextPage: boolean = true;

    while (isNextPage) {
        // Assumes data is ordered by publishedAt desc.
        const { data: playlistItemsData } = await youtube.playlistItems.list({
            playlistId: 'PLIMWH1uKd3oE905uSUHdE5hd6e2UpADak',
            part: ['contentDetails'],
            maxResults: 10,
            pageToken
        });

        pageToken = playlistItemsData.nextPageToken ?? undefined;
        isNextPage = typeof pageToken === 'string';

        const isString = (val: string | null | undefined): val is string => typeof val === 'string';

        const videoIds = (playlistItemsData.items ?? [])
            .map(({ contentDetails }) => contentDetails?.videoId)
            .filter(isString);

        const { data: videosData } = await youtube.videos.list({
            part: ['snippet'],
            id: videoIds
        });

        const newItems = (videosData.items ?? []).filter(({ id, snippet }) => {
            const publishedAt = snippet?.publishedAt ?? null;

            if (publishedAt === null) {
                return false;
            }

            return (
                latestVideos.length === 0 ||
                (publishedAt >= latestVideos[0].publishedAt &&
                    latestVideos.find((video) => video.id === id) === undefined)
            );
        });

        if (newItems.length < (videosData.items ?? []).length) {
            isNextPage = false;
        }

        const isValidNewItem = (item: youtube_v3.Schema$Video): item is ValidNewItem =>
            typeof item.id === 'string' && typeof item.snippet?.publishedAt === 'string';

        const validNewItems: ValidNewItem[] = newItems.filter(isValidNewItem);

        newVideos = newVideos.concat(
            validNewItems.map(({ id, snippet: { publishedAt, title, description } }) => ({
                id,
                title: title ?? '',
                description: description ?? '',
                publishedAt,
                linkData: generateLinkData({ id, description: description ?? '' })
            }))
        );
    }

    return newVideos;
};

type SuccessResponse = {
    success: true;
};

type ErrorResponse = {
    statusCode: number;
    message: string;
};

const handler = async (
    req: NextApiRequest,
    res: NextApiResponse<SuccessResponse | ErrorResponse>
) => {
    if (req.method !== 'POST') {
        return res.status(404).json({
            statusCode: 404,
            message: 'Not Found'
        });
    }

    if ((req.headers?.authorization ?? '').slice('Bearer '.length) !== process.env.AUTHN_API_KEY) {
        return res.status(403).json({
            statusCode: 403,
            message: 'Forbidden'
        });
    }

    const recentVideos = await fetchRecentVideos();

    // Assumes recentVideos is sorted by publishedAt desc (but ties may exist).
    const latestVideos = recentVideos.reduce((acc: Video[], video) => {
        if (acc.length === 0) {
            return [video];
        }

        if (video.publishedAt >= acc[0].publishedAt) {
            if (video.publishedAt > acc[0].publishedAt) {
                throw new Error('Bad Implementation!');
            }

            acc.push(video);
            return acc;
        }

        return acc;
    }, []);

    const newVideos = await fetchNewVideos(latestVideos);

    if (newVideos.length > 0) {
        await addVideos(newVideos);

        const months = Object.keys(groupVideosByMonth(newVideos));

        await Promise.all([
            res.revalidate('/recent'),
            res.revalidate('/archives'),
            ...months.map((month) => res.revalidate(`/archives/${month}`))
        ]);
    }

    return res.status(200).json({ success: true });
};

export default handler;
